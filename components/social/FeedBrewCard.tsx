"use client";

import { FeedBrew } from "@/lib/types/sharing";
import { Timestamp } from "firebase/firestore";

// Icons
function UserIcon({ className }: { className?: string }) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function StarIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

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

function formatDateTime(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return "Unknown";

  const date = timestamp.toDate();
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 24 hours
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours < 1) {
      const mins = Math.floor(diff / (60 * 1000));
      return mins < 1 ? "Just now" : `${mins}m ago`;
    }
    return `${hours}h ago`;
  }

  // Less than 7 days
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days}d ago`;
  }

  // Otherwise show date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface FeedBrewCardProps {
  feedBrew: FeedBrew;
}

export function FeedBrewCard({ feedBrew }: FeedBrewCardProps) {
  const { brew, userDisplayName, userProfileCode, timestamp } = feedBrew;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* User header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
          <UserIcon className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {userDisplayName || "Anonymous"}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {userProfileCode}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDateTime(timestamp)}
        </span>
      </div>

      {/* Brew content */}
      <div className="p-4 space-y-3">
        {/* Coffee name and rating */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <CoffeeIcon className="w-5 h-5 text-accent shrink-0" />
            <span className="font-semibold">
              {brew.coffeeName || "Unknown Coffee"}
            </span>
          </div>
          {brew.rating && (
            <div className="flex items-center gap-1 shrink-0">
              <StarIcon className="w-4 h-4 text-accent" filled />
              <span className="text-sm font-medium">{brew.rating}/10</span>
            </div>
          )}
        </div>

        {/* Brew parameters */}
        <div className="flex flex-wrap gap-2 text-sm">
          {brew.brewerName && (
            <span className="px-2 py-1 bg-muted rounded-md">
              {brew.brewerName}
            </span>
          )}
          {brew.doseGrams && brew.waterGrams && (
            <span className="px-2 py-1 bg-muted rounded-md">
              {brew.doseGrams}g → {brew.waterGrams}g
            </span>
          )}
          {brew.ratio && (
            <span className="px-2 py-1 bg-muted rounded-md">
              1:{brew.ratio.toFixed(1)}
            </span>
          )}
        </div>

        {/* Tasting notes if present */}
        {brew.tastingNotes && (
          <p className="text-sm text-muted-foreground italic line-clamp-2">
            "{brew.tastingNotes}"
          </p>
        )}
      </div>
    </div>
  );
}
