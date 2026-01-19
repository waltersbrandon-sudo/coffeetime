"use client";

import { useState, useEffect } from "react";

// Icons
function CoffeeIcon({ className }: { className?: string }) {
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
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  );
}

function GrinderIcon({ className }: { className?: string }) {
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
      <path d="M5 8h14" />
      <path d="M5 8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2" />
      <path d="M7 8v8a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4V8" />
      <path d="M9 12h6" />
    </svg>
  );
}

function BrewerIcon({ className }: { className?: string }) {
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
      <path d="M10 2v2" />
      <path d="M14 2v2" />
      <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
      <path d="M6 2v2" />
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

interface EquipmentPhotoProps {
  photoURL?: string | null;
  thumbnailURL?: string | null;
  name: string;
  type: "coffee" | "grinder" | "brewer";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  isGenerating?: boolean;
  showGenerateHint?: boolean;
  onGenerateRequest?: () => void;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-20 h-20",
  xl: "w-14 h-14",
};

const iconSizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-10 h-10",
  xl: "w-7 h-7",
};

export function EquipmentPhoto({
  photoURL,
  thumbnailURL,
  name,
  type,
  size = "md",
  className = "",
  isGenerating = false,
  showGenerateHint = false,
  onGenerateRequest,
}: EquipmentPhotoProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Prefer thumbnailURL over photoURL for display
  const displayURL = thumbnailURL || photoURL;
  const showFallback = !displayURL || imageError;

  // Reset loading/error states when the URL changes
  useEffect(() => {
    if (displayURL) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [displayURL]);

  const FallbackIcon = {
    coffee: CoffeeIcon,
    grinder: GrinderIcon,
    brewer: BrewerIcon,
  }[type];

  // Generating state with shimmer animation
  if (isGenerating) {
    return (
      <div
        className={`${sizeClasses[size]} relative rounded-lg overflow-hidden bg-muted ${className}`}
        title="Generating..."
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-500/10">
          <SparklesIcon className="w-4 h-4 text-purple-500 animate-pulse" />
        </div>
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent animate-shimmer" />
      </div>
    );
  }

  if (showFallback) {
    return (
      <div
        className={`${sizeClasses[size]} relative flex items-center justify-center rounded-lg bg-muted text-muted-foreground ${className} ${
          showGenerateHint && onGenerateRequest
            ? "cursor-pointer hover:bg-purple-500/10 hover:text-purple-500 transition-colors group"
            : ""
        }`}
        title={showGenerateHint ? "Click to generate thumbnail" : name}
        onClick={showGenerateHint && onGenerateRequest ? onGenerateRequest : undefined}
      >
        <FallbackIcon className={iconSizeClasses[size]} />
        {showGenerateHint && onGenerateRequest && (
          <div className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <SparklesIcon className="w-2 h-2 text-white" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} relative rounded-lg overflow-hidden bg-muted ${className}`}
      title={name}
    >
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        </div>
      )}
      <img
        src={displayURL}
        alt={name}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          imageLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
      />
    </div>
  );
}
