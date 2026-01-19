"use client";

import { useState } from "react";
import { CircleBrew } from "@/lib/types/circles";
import { Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import { importBrewFromCircle } from "@/lib/services/brewImportService";
import { useToast } from "@/hooks/use-toast";

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

function ImportIcon({ className }: { className?: string }) {
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
      <path d="M12 3v12" />
      <path d="m8 11 4 4 4-4" />
      <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
    </svg>
  );
}

function formatDateTime(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return "Unknown";

  const date = timestamp.toDate();
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours < 1) {
      const mins = Math.floor(diff / (60 * 1000));
      return mins < 1 ? "Just now" : `${mins}m ago`;
    }
    return `${hours}h ago`;
  }

  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days}d ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface CircleBrewCardProps {
  circleBrew: CircleBrew;
  circleId: string;
  circleName: string;
  showImportButton?: boolean;
}

export function CircleBrewCard({
  circleBrew,
  circleId,
  circleName,
  showImportButton = true,
}: CircleBrewCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  const { brew, postedBy, postedByName, postedAt } = circleBrew;

  // Don't show import button for user's own brews
  const isOwnBrew = user?.uid === postedBy;

  const handleImport = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to import brews",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      await importBrewFromCircle(user.uid, circleBrew, circleId, circleName);
      setImported(true);
      toast({
        title: "Brew imported",
        description: "The brew has been added to your history",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import brew",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* User header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
          <UserIcon className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {postedByName || "Anonymous"}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDateTime(postedAt)}
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

        {/* Import button */}
        {showImportButton && !isOwnBrew && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
              disabled={importing || imported}
              className="w-full"
            >
              {imported ? (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Imported
                </>
              ) : importing ? (
                "Importing..."
              ) : (
                <>
                  <ImportIcon className="w-4 h-4 mr-2" />
                  Import to My Brews
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
