"use client";

import { useState, useEffect, KeyboardEvent } from "react";
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
import { useAuth } from "@/lib/context/AuthContext";
import { addCoffee, updateCoffee } from "@/lib/services/coffeeService";
import { Coffee } from "@/lib/types";
import { Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { PhotoUploadField } from "./PhotoUploadField";
import { useThumbnailGeneration } from "@/lib/hooks/useThumbnailGeneration";

interface CoffeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  existingCoffee?: Coffee | null;
}

const PROCESS_OPTIONS = [
  { value: "washed", label: "Washed" },
  { value: "natural", label: "Natural" },
  { value: "honey", label: "Honey" },
  { value: "anaerobic", label: "Anaerobic" },
  { value: "other", label: "Other" },
];

const ROAST_LEVEL_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "light-medium", label: "Light-Medium" },
  { value: "medium", label: "Medium" },
  { value: "medium-dark", label: "Medium-Dark" },
  { value: "dark", label: "Dark" },
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

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/20 text-accent text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-accent/70"
            >
              <XIcon className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => inputValue && addTag(inputValue)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function CoffeeForm({ isOpen, onClose, existingCoffee }: CoffeeFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [roaster, setRoaster] = useState("");
  const [origin, setOrigin] = useState("");
  const [region, setRegion] = useState("");
  const [process, setProcess] = useState("");
  const [variety, setVariety] = useState("");
  const [roastLevel, setRoastLevel] = useState("");
  const [roastDate, setRoastDate] = useState("");
  const [flavorNotes, setFlavorNotes] = useState<string[]>([]);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [thumbnailURL, setThumbnailURL] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const { isGenerating, error: generateError, regenerateThumbnail } = useThumbnailGeneration();
  const isEditing = !!existingCoffee;

  useEffect(() => {
    if (existingCoffee) {
      setName(existingCoffee.name || "");
      setRoaster(existingCoffee.roaster || "");
      setOrigin(existingCoffee.origin || "");
      setRegion(existingCoffee.region || "");
      setProcess(existingCoffee.process || "");
      setVariety(existingCoffee.variety || "");
      setRoastLevel(existingCoffee.roastLevel || "");
      setRoastDate(
        existingCoffee.roastDate
          ? existingCoffee.roastDate.toDate().toISOString().split("T")[0]
          : ""
      );
      setFlavorNotes(existingCoffee.flavorNotes || []);
      setPhotoURL(existingCoffee.photoURL || null);
      setThumbnailURL(existingCoffee.thumbnailURL || null);
      setNotes(existingCoffee.notes || "");
    } else {
      resetForm();
    }
  }, [existingCoffee, isOpen]);

  const resetForm = () => {
    setName("");
    setRoaster("");
    setOrigin("");
    setRegion("");
    setProcess("");
    setVariety("");
    setRoastLevel("");
    setRoastDate("");
    setFlavorNotes([]);
    setPhotoURL(null);
    setThumbnailURL(null);
    setNotes("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleGenerateWithAI = async () => {
    if (!existingCoffee || !name.trim()) {
      toast({
        title: "Save first",
        description: "Please save the coffee before generating a thumbnail.",
      });
      return;
    }

    const newURL = await regenerateThumbnail(existingCoffee, "coffee");
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
      const coffeeData = {
        name: name.trim(),
        roaster: roaster.trim() || null,
        origin: origin.trim() || null,
        region: region.trim() || null,
        process: process || null,
        variety: variety.trim() || null,
        roastLevel: roastLevel || null,
        roastDate: roastDate ? Timestamp.fromDate(new Date(roastDate)) : null,
        flavorNotes: flavorNotes.length > 0 ? flavorNotes : null,
        photoURL: photoURL || null,
        thumbnailURL: thumbnailURL || null,
        notes: notes.trim() || null,
      };

      if (isEditing && existingCoffee) {
        await updateCoffee(user.uid, existingCoffee.id, coffeeData);
      } else {
        await addCoffee(user.uid, coffeeData);
      }

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save coffee");
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
            {isEditing ? "Edit Coffee" : "Add Coffee"}
          </h1>
          <Button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            size="sm"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
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
            name={name || "Coffee"}
            type="coffee"
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
            placeholder="e.g., Ethiopia Yirgacheffe"
            required
          />
        </div>

        {/* Roaster */}
        <div className="space-y-2">
          <Label htmlFor="roaster">Roaster</Label>
          <Input
            id="roaster"
            value={roaster}
            onChange={(e) => setRoaster(e.target.value)}
            placeholder="e.g., Counter Culture"
          />
        </div>

        {/* Origin & Region - Side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="origin">Origin</Label>
            <Input
              id="origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g., Ethiopia"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g., Yirgacheffe"
            />
          </div>
        </div>

        {/* Process */}
        <div className="space-y-2">
          <Label htmlFor="process">Process</Label>
          <Select value={process} onValueChange={setProcess}>
            <SelectTrigger>
              <SelectValue placeholder="Select process" />
            </SelectTrigger>
            <SelectContent>
              {PROCESS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Variety */}
        <div className="space-y-2">
          <Label htmlFor="variety">Variety</Label>
          <Input
            id="variety"
            value={variety}
            onChange={(e) => setVariety(e.target.value)}
            placeholder="e.g., Heirloom, Bourbon, Gesha"
          />
        </div>

        {/* Roast Level & Date - Side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="roastLevel">Roast Level</Label>
            <Select value={roastLevel} onValueChange={setRoastLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {ROAST_LEVEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="roastDate">Roast Date</Label>
            <Input
              id="roastDate"
              type="date"
              value={roastDate}
              onChange={(e) => setRoastDate(e.target.value)}
            />
          </div>
        </div>

        {/* Flavor Notes */}
        <div className="space-y-2">
          <Label>Flavor Notes</Label>
          <TagInput
            value={flavorNotes}
            onChange={setFlavorNotes}
            placeholder="Type and press Enter to add"
          />
          <p className="text-xs text-muted-foreground">
            Press Enter or comma to add a note
          </p>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about this coffee..."
            rows={3}
          />
        </div>
      </form>
    </div>
  );
}
