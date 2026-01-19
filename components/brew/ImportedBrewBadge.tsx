"use client";

import { CoffeeTime } from "@/lib/types";

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

interface ImportedBrewBadgeProps {
  importedFrom: NonNullable<CoffeeTime["importedFrom"]>;
  compact?: boolean;
}

export function ImportedBrewBadge({ importedFrom, compact = false }: ImportedBrewBadgeProps) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full border border-purple-500/20">
        <ImportIcon className="w-3 h-3" />
        Imported
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg border border-purple-500/20">
      <ImportIcon className="w-4 h-4 shrink-0" />
      <span>
        Imported from <strong>{importedFrom.circleName}</strong>
        {importedFrom.originalCreatorName && (
          <span className="text-muted-foreground"> by {importedFrom.originalCreatorName}</span>
        )}
      </span>
    </div>
  );
}
