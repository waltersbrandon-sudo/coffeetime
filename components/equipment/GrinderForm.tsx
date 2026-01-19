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
import { addGrinder, updateGrinder, deleteGrinder } from "@/lib/services/grinderService";
import { getCatalogGrinders } from "@/lib/data/catalog";
import { Grinder } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { PhotoUploadField } from "./PhotoUploadField";
import { useThumbnailGeneration } from "@/lib/hooks/useThumbnailGeneration";

interface GrinderFormProps {
  isOpen: boolean;
  onClose: () => void;
  existingGrinder?: Grinder | null;
}

const TYPE_OPTIONS = [
  { value: "electric", label: "Electric" },
  { value: "hand", label: "Hand" },
];

const BURR_TYPE_OPTIONS = [
  { value: "flat", label: "Flat" },
  { value: "conical", label: "Conical" },
];

const SETTINGS_TYPE_OPTIONS = [
  { value: "stepped", label: "Stepped" },
  { value: "stepless", label: "Stepless" },
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

export function GrinderForm({ isOpen, onClose, existingGrinder }: GrinderFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [type, setType] = useState("");
  const [burrType, setBurrType] = useState("");
  const [burrSize, setBurrSize] = useState("");
  const [settingsMin, setSettingsMin] = useState("");
  const [settingsMax, setSettingsMax] = useState("");
  const [settingsType, setSettingsType] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [thumbnailURL, setThumbnailURL] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const { isGenerating, error: generateError, regenerateThumbnail } = useThumbnailGeneration();
  const isEditing = !!existingGrinder;

  useEffect(() => {
    if (existingGrinder) {
      setName(existingGrinder.name || "");
      setBrand(existingGrinder.brand || "");
      setModel(existingGrinder.model || "");
      setType(existingGrinder.type || "");
      setBurrType(existingGrinder.burrType || "");
      setBurrSize(existingGrinder.burrSize?.toString() || "");
      setSettingsMin(existingGrinder.settingsMin?.toString() || "");
      setSettingsMax(existingGrinder.settingsMax?.toString() || "");
      setSettingsType(existingGrinder.settingsType || "");
      setPhotoURL(existingGrinder.photoURL || null);
      setThumbnailURL(existingGrinder.thumbnailURL || null);
      setNotes(existingGrinder.notes || "");
    } else {
      resetForm();
    }
  }, [existingGrinder, isOpen]);

  const resetForm = () => {
    setName("");
    setBrand("");
    setModel("");
    setType("");
    setBurrType("");
    setBurrSize("");
    setSettingsMin("");
    setSettingsMax("");
    setSettingsType("");
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
    if (!existingGrinder || !name.trim()) {
      toast({
        title: "Save first",
        description: "Please save the grinder before generating a thumbnail.",
      });
      return;
    }

    const newURL = await regenerateThumbnail(existingGrinder, "grinder");
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
    if (!user || !existingGrinder) return;

    setDeleting(true);
    try {
      await deleteGrinder(user.uid, existingGrinder.id);
      toast({
        title: "Grinder deleted",
        description: "The grinder has been removed from your collection.",
      });
      handleClose();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete grinder",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleRestoreDefaults = () => {
    if (!existingGrinder?.isCatalogItem) return;

    // Find the catalog item
    const catalogGrinders = getCatalogGrinders();
    const catalogItem = catalogGrinders.find(
      (g) => g.id === existingGrinder.id ||
        (g.name === existingGrinder.name && g.brand === existingGrinder.brand)
    );

    if (catalogItem) {
      setName(catalogItem.name || "");
      setBrand(catalogItem.brand || "");
      setModel(catalogItem.model || "");
      setType(catalogItem.type || "");
      setBurrType(catalogItem.burrType || "");
      setBurrSize(catalogItem.burrSize?.toString() || "");
      setSettingsMin(catalogItem.settingsMin?.toString() || "");
      setSettingsMax(catalogItem.settingsMax?.toString() || "");
      setSettingsType(catalogItem.settingsType || "");
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
      const grinderData = {
        name: name.trim(),
        brand: brand.trim() || null,
        model: model.trim() || null,
        type: type || null,
        burrType: burrType || null,
        burrSize: burrSize ? parseFloat(burrSize) : null,
        settingsMin: settingsMin ? parseFloat(settingsMin) : null,
        settingsMax: settingsMax ? parseFloat(settingsMax) : null,
        settingsType: settingsType || null,
        photoURL: photoURL || null,
        thumbnailURL: thumbnailURL || null,
        notes: notes.trim() || null,
      };

      if (isEditing && existingGrinder) {
        await updateGrinder(user.uid, existingGrinder.id, grinderData);
      } else {
        await addGrinder(user.uid, grinderData);
      }

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save grinder");
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
            {isEditing ? "Edit Grinder" : "Add Grinder"}
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
            name={name || "Grinder"}
            type="grinder"
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
            placeholder="e.g., Comandante C40"
            required
          />
        </div>

        {/* Brand & Model - Side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., Comandante"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g., C40 MK4"
            />
          </div>
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

        {/* Burr Type & Size - Side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="burrType">Burr Type</Label>
            <Select value={burrType} onValueChange={setBurrType}>
              <SelectTrigger>
                <SelectValue placeholder="Select burr type" />
              </SelectTrigger>
              <SelectContent>
                {BURR_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="burrSize">Burr Size (mm)</Label>
            <Input
              id="burrSize"
              type="number"
              value={burrSize}
              onChange={(e) => setBurrSize(e.target.value)}
              placeholder="e.g., 38"
            />
          </div>
        </div>

        {/* Settings Range - Side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settingsMin">Settings Min</Label>
            <Input
              id="settingsMin"
              type="number"
              step="any"
              value={settingsMin}
              onChange={(e) => setSettingsMin(e.target.value)}
              placeholder="e.g., 0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settingsMax">Settings Max</Label>
            <Input
              id="settingsMax"
              type="number"
              step="any"
              value={settingsMax}
              onChange={(e) => setSettingsMax(e.target.value)}
              placeholder="e.g., 50"
            />
          </div>
        </div>

        {/* Settings Type */}
        <div className="space-y-2">
          <Label htmlFor="settingsType">Settings Type</Label>
          <Select value={settingsType} onValueChange={setSettingsType}>
            <SelectTrigger>
              <SelectValue placeholder="Select settings type" />
            </SelectTrigger>
            <SelectContent>
              {SETTINGS_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about this grinder..."
            rows={3}
          />
        </div>

        {/* Restore Defaults (only for catalog items) */}
        {isEditing && existingGrinder?.isCatalogItem && (
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
            <DialogTitle>Delete this grinder?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This grinder will be permanently removed
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
