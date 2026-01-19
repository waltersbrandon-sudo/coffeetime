"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useBrewers } from "@/lib/hooks/useBrewers";
import { Brewer } from "@/lib/types";
import { BrewerForm } from "@/components/equipment/BrewerForm";

function ChevronLeftIcon({ className }: { className?: string }) {
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
      <path d="m15 18-6-6 6-6" />
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

interface EmptyStateProps {
  onAdd: () => void;
}

function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">🫖</div>
      <h3 className="text-lg font-semibold mb-2">No brewers yet</h3>
      <p className="text-muted-foreground mb-6 max-w-xs">
        Add your brewing equipment to track your recipes.
      </p>
      <Button onClick={onAdd}>
        <PlusIcon className="w-4 h-4 mr-2" />
        Add your first brewer
      </Button>
    </div>
  );
}

interface BrewerCardProps {
  brewer: Brewer;
  onClick: () => void;
}

function BrewerCard({ brewer, onClick }: BrewerCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg bg-card border border-border hover:bg-card/80 transition-colors"
    >
      <h3 className="font-medium truncate">{brewer.name}</h3>
      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
        {brewer.brand && <span>{brewer.brand}</span>}
        {brewer.brand && brewer.type && (
          <span className="text-border">•</span>
        )}
        {brewer.type && (
          <span className="capitalize">{brewer.type.replace(/-/g, " ")}</span>
        )}
        {!brewer.brand && !brewer.type && (
          <span className="italic">No details</span>
        )}
      </div>
    </button>
  );
}

export default function BrewersPage() {
  const { brewers, loading } = useBrewers();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBrewer, setEditingBrewer] = useState<Brewer | null>(null);

  const handleAdd = () => {
    setEditingBrewer(null);
    setIsFormOpen(true);
  };

  const handleEdit = (brewer: Brewer) => {
    setEditingBrewer(brewer);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingBrewer(null);
  };

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Link
            href="/settings"
            className="p-2 -ml-2 rounded-lg hover:bg-accent/10 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">My Brewers</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <LoadingSpinner />
        ) : brewers.length === 0 ? (
          <EmptyState onAdd={handleAdd} />
        ) : (
          <div className="space-y-3">
            {brewers.map((brewer) => (
              <BrewerCard
                key={brewer.id}
                brewer={brewer}
                onClick={() => handleEdit(brewer)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {!loading && brewers.length > 0 && (
        <button
          onClick={handleAdd}
          className="fixed bottom-20 right-4 w-14 h-14 bg-accent text-accent-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-accent/90 transition-colors"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      )}

      {/* Brewer Form Modal */}
      <BrewerForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        existingBrewer={editingBrewer}
      />
    </main>
  );
}
