"use client";

import { useState, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// Icons
function MoreVerticalIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

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
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

interface ThumbnailActionsMenuProps {
  hasPhoto: boolean;
  isGenerating?: boolean;
  onTakePhoto: () => void;
  onChooseFile: () => void;
  onGenerateWithAI: () => void;
  onRemovePhoto: () => void;
  disabled?: boolean;
}

export function ThumbnailActionsMenu({
  hasPhoto,
  isGenerating,
  onTakePhoto,
  onChooseFile,
  onGenerateWithAI,
  onRemovePhoto,
  disabled,
}: ThumbnailActionsMenuProps) {
  const [open, setOpen] = useState(false);

  const handleAction = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={disabled || isGenerating}
        >
          {isGenerating ? (
            <LoadingSpinner className="h-4 w-4" />
          ) : (
            <MoreVerticalIcon className="h-4 w-4" />
          )}
          <span className="sr-only">Photo options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handleAction(onTakePhoto)}
          disabled={isGenerating}
        >
          <CameraIcon className="mr-2 h-4 w-4" />
          Take Photo
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleAction(onChooseFile)}
          disabled={isGenerating}
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          Choose from Library
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleAction(onGenerateWithAI)}
          disabled={isGenerating}
          className="text-purple-600 dark:text-purple-400 focus:text-purple-600 dark:focus:text-purple-400"
        >
          <SparklesIcon className="mr-2 h-4 w-4" />
          {isGenerating ? "Generating..." : "Generate with AI"}
        </DropdownMenuItem>
        {hasPhoto && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleAction(onRemovePhoto)}
              disabled={isGenerating}
              className="text-destructive focus:text-destructive"
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Remove Photo
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ThumbnailActionsMenuWithInputsProps {
  hasPhoto: boolean;
  isGenerating?: boolean;
  onGenerateWithAI: () => void;
  onPhotoSelected: (file: File) => void;
  onRemovePhoto: () => void;
  disabled?: boolean;
}

/**
 * A version of ThumbnailActionsMenu that includes the hidden file inputs
 * for taking photos and choosing files
 */
export function ThumbnailActionsMenuWithInputs({
  hasPhoto,
  isGenerating,
  onGenerateWithAI,
  onPhotoSelected,
  onRemovePhoto,
  disabled,
}: ThumbnailActionsMenuWithInputsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoSelected(file);
    }
    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  const handleTakePhoto = () => {
    cameraInputRef.current?.click();
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <ThumbnailActionsMenu
        hasPhoto={hasPhoto}
        isGenerating={isGenerating}
        onTakePhoto={handleTakePhoto}
        onChooseFile={handleChooseFile}
        onGenerateWithAI={onGenerateWithAI}
        onRemovePhoto={onRemovePhoto}
        disabled={disabled}
      />
    </>
  );
}
