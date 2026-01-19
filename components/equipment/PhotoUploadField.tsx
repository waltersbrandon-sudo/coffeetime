"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { EquipmentPhoto } from "./EquipmentPhoto";

// Icons
function CameraIcon({ className }: { className?: string }) {
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
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
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
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

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

function SparklesIcon({ className }: { className?: string }) {
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
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

interface PhotoUploadFieldProps {
  value: string | null;
  thumbnailURL?: string | null;
  onChange: (url: string | null) => void;
  onThumbnailChange?: (url: string | null) => void;
  name: string;
  type: "coffee" | "grinder" | "brewer";
  isGenerating?: boolean;
  onGenerateWithAI?: () => void;
}

export function PhotoUploadField({
  value,
  thumbnailURL,
  onChange,
  onThumbnailChange,
  name,
  type,
  isGenerating = false,
  onGenerateWithAI,
}: PhotoUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      // Create a preview URL for immediate display
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Convert to base64 for simple storage
      // In production, you'd upload to Firebase Storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onChange(base64);
        setUploading(false);
      };
      reader.onerror = () => {
        alert("Failed to process image");
        setUploading(false);
        setPreviewUrl(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert("Failed to upload image");
      setUploading(false);
      setPreviewUrl(null);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    onThumbnailChange?.(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const displayUrl = previewUrl || thumbnailURL || value;
  const isDisabled = uploading || isGenerating;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <EquipmentPhoto
          photoURL={value}
          thumbnailURL={thumbnailURL}
          name={name || "Equipment"}
          type={type}
          size="lg"
          className="shrink-0"
          isGenerating={isGenerating}
        />
        <div className="flex flex-col gap-2">
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {displayUrl ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isDisabled}
              >
                <CameraIcon className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isDisabled}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Choose File
              </Button>
              {onGenerateWithAI && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onGenerateWithAI}
                  disabled={isDisabled}
                  className="border-purple-500/50 text-purple-600 hover:bg-purple-500/10 dark:text-purple-400"
                >
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  {isGenerating ? "Generating..." : "Regenerate"}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isDisabled}
              >
                <XIcon className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isDisabled}
              >
                <CameraIcon className="w-4 h-4 mr-2" />
                {uploading ? "Uploading..." : "Take Photo"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isDisabled}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {uploading ? "Uploading..." : "Choose File"}
              </Button>
              {onGenerateWithAI && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onGenerateWithAI}
                  disabled={isDisabled}
                  className="border-purple-500/50 text-purple-600 hover:bg-purple-500/10 dark:text-purple-400"
                >
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  {isGenerating ? "Generating..." : "Generate with AI"}
                </Button>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Max 5MB, JPG or PNG
          </p>
        </div>
      </div>
    </div>
  );
}
