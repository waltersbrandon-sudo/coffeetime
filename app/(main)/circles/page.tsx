"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUserCircles } from "@/lib/hooks/useCircles";
import { CreateCircleDialog } from "@/components/circles/CreateCircleDialog";
import { JoinCircleDialog } from "@/components/circles/JoinCircleDialog";
import { CircleCard } from "@/components/circles/CircleCard";

// Icons
function UsersIcon({ className }: { className?: string }) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <svg
        className="animate-spin h-8 w-8 text-accent"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
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
    </div>
  );
}

function EmptyState({
  onCreateClick,
  onJoinClick,
}: {
  onCreateClick: () => void;
  onJoinClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <UsersIcon className="w-16 h-16 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">No Circles Yet</h2>
      <p className="text-muted-foreground text-sm max-w-xs mb-6">
        Coffee Circles let you share brews with friends and groups.
        Create one or join an existing circle.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onJoinClick}>
          Join Circle
        </Button>
        <Button onClick={onCreateClick}>
          <PlusIcon className="w-4 h-4 mr-1" />
          Create Circle
        </Button>
      </div>
    </div>
  );
}

export default function CirclesPage() {
  const { circles, loading } = useUserCircles();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-semibold">Coffee Circles</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsJoinOpen(true)}
            >
              Join
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Create
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <LoadingSpinner />
        ) : circles.length === 0 ? (
          <EmptyState
            onCreateClick={() => setIsCreateOpen(true)}
            onJoinClick={() => setIsJoinOpen(true)}
          />
        ) : (
          <div className="space-y-3">
            {circles.map((membership) => (
              <CircleCard key={membership.id} membership={membership} />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateCircleDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
      <JoinCircleDialog
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
      />
    </main>
  );
}
