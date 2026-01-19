"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/context/AuthContext";
import { addBrewer, updateBrewer, deleteBrewer } from "@/lib/services/brewerService";
import { getCatalogBrewers } from "@/lib/data/catalog";
import { Brewer } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { PhotoUploadField } from "./PhotoUploadField";
import { useThumbnailGeneration } from "@/lib/hooks/useThumbnailGeneration";

interface BrewerFormProps {
  isOpen: boolean;
  onClose: () => void;
  existingBrewer?: Brewer | null;
}

const TYPE_OPTIONS = [
  { value: "pour-over", label: "Pour Over" },
  { value: "immersion", label: "Immersion" },
  { value: "espresso", label: "Espresso" },
  { value: "drip", label: "Drip" },
  { value: "french-press", label: "French Press" },
  { value: "other", label: "Other" },
];

const FILTER_TYPE_OPTIONS = [
  { value: "paper", label: "Paper" },
  { value: "metal", label: "Metal" },
  { value: "cloth", label: "Cloth" },
  { value: "none", label: "None" },
];

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function BrewerForm({ isOpen, onClose, existingBrewer }: BrewerFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [type, setType] = useState("");
  const [material, setMaterial] = useState("");
  const [capacityMl, setCapacityMl] = useState("");
  const [filterType, setFilterType] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [thumbnailURL, setThumbnailURL] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const { isGenerating, error: generateError, regenerateThumbnail } = useThumbnailGeneration();
  const isEditing = !!existingBrewer;

  useEffect(() => {
    if (existingBrewer) {
      setName(existingBrewer.name || "");
      setBrand(existingBrewer.brand || "");
      setType(existingBrewer.type || "");
      setMaterial(existingBrewer.material || "");
      setCapacityMl(existingBrewer.capacityMl?.toString() || "");
      setFilterType(existingBrewer.filterType || "");
      setPhotoURL(existingBrewer.photoURL || null);
      setThumbnailURL(existingBrewer.thumbnailURL || null);
      setNotes(existingBrewer.notes || "");
    } else {
      resetForm();
    }
  }, [existingBrewer, isOpen]);

  const resetForm = () => {
    setName("");
    setBrand("");
    setType("");
    setMaterial("");
    setCapacityMl("");
    setFilterType("");
    setPhotoURL(null);
    setThumbnailURL(null);
    setNotes("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    setIsDeleteDialogOpen(false);
    onClose();
  };

  const handleGenerateWithAI = async () => {
    if (!existingBrewer || !name.trim()) {
      toast({
        title: "Save first",
        description: "Please save the brewer before generating a thumbnail.",
      });
      return;
    }

    const newURL = await regenerateThumbnail(existingBrewer, "brewer");
    if (newURL) {
      setThumbnailURL(newURL);
      toast({
        title: "Thumbnail generated",
        description: "AI-generated thumbnail has been saved.",
      });
    } else if (generateError) {
      toast({
        title: "Generation failed",
        description: generateError,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!user || !existingBrewer) return;

    setDeleting(true);
    try {
      await deleteBrewer(user.uid, existingBrewer.id);
      toast({
        title: "Brewer deleted",
        description: "The brewer has been removed from your collection.",
      });
      handleClose();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete brewer",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleRestoreDefaults = () => {
    if (!existingBrewer?.isCatalogItem) return;

    // Find the catalog item
    const catalogBrewers = getCatalogBrewers();
    const catalogItem = catalogBrewers.find(
      (b) => b.id === existingBrewer.id ||
        (b.name === existingBrewer.name && b.brand === existingBrewer.brand)
    );

    if (catalogItem) {
      setName(catalogItem.name || "");
      setBrand(catalogItem.brand || "");
      setType(catalogItem.type || "");
      setMaterial(catalogItem.material || "");
      setCapacityMl(catalogItem.capacityMl?.toString() || "");
      setFilterType(catalogItem.filterType || "");
      setPhotoURL(catalogItem.photoURL || null);
      setNotes(catalogItem.notes || "");

      toast({
        title: "Defaults restored",
        description: "Values have been reset to catalog defaults. Save to apply.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in");
      return;
    }

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const brewerData = {
        name: name.trim(),
        brand: brand.trim() || null,
        type: type || null,
        material: material.trim() || null,
        capacityMl: capacityMl ? parseInt(capacityMl, 10) : null,
        filterType: filterType || null,
        photoURL: photoURL || null,
        thumbnailURL: thumbnailURL || null,
        notes: notes.trim() || null,
      };

      if (isEditing && existingBrewer) {
        await updateBrewer(user.uid, existingBrewer.id, brewerData);
      } else {
        await addBrewer(user.uid, brewerData);
      }

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save brewer");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            type="button"
            onClick={handleClose}
            className="p-2 -ml-2 rounded-lg hover:bg-accent/10 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">
            {isEditing ? "Edit Brewer" : "Add Brewer"}
          </h1>
          <div className="flex items-center gap-2">
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                Delete
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={saving || !name.trim()}
              size="sm"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 pb-8 space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Photo Upload */}
        <div className="space-y-2">
          <Label>Photo</Label>
          <PhotoUploadField
            value={photoURL}
            thumbnailURL={thumbnailURL}
            onChange={setPhotoURL}
            onThumbnailChange={setThumbnailURL}
            name={name || "Brewer"}
            type="brewer"
            isGenerating={isGenerating}
            onGenerateWithAI={isEditing ? handleGenerateWithAI : undefined}
          />
        </div>

        {/* Name - Required */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., V60 02"
            required
          />
        </div>

        {/* Brand */}
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g., Hario"
          />
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Material */}
        <div className="space-y-2">
          <Label htmlFor="material">Material</Label>
          <Input
            id="material"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="e.g., Ceramic, Glass, Plastic"
          />
        </div>

        {/* Capacity & Filter Type - Side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="capacityMl">Capacity (ml)</Label>
            <Input
              id="capacityMl"
              type="number"
              value={capacityMl}
              onChange={(e) => setCapacityMl(e.target.value)}
              placeholder="e.g., 600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filterType">Filter Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Select filter" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about this brewer..."
            rows={3}
          />
        </div>

        {/* Restore Defaults (only for catalog items) */}
        {isEditing && existingBrewer?.isCatalogItem && (
          <div className="pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleRestoreDefaults}
              className="w-full"
            >
              Restore to Catalog Defaults
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Reset all fields to the original catalog values
            </p>
          </div>
        )}
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this brewer?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This brewer will be permanently removed
              from your collection.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
