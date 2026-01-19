"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useGrinders } from "@/lib/hooks/useGrinders";
import { Grinder } from "@/lib/types";
import { GrinderForm } from "@/components/equipment/GrinderForm";
import { EquipmentPhoto } from "@/components/equipment/EquipmentPhoto";

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
      <div className="text-6xl mb-4">⚙️</div>
      <h3 className="text-lg font-semibold mb-2">No grinders yet</h3>
      <p className="text-muted-foreground mb-6 max-w-xs">
        Add your grinder to track grind settings across brews.
      </p>
      <Button onClick={onAdd}>
        <PlusIcon className="w-4 h-4 mr-2" />
        Add your first grinder
      </Button>
    </div>
  );
}

interface GrinderCardProps {
  grinder: Grinder;
  onClick: () => void;
}

function GrinderCard({ grinder, onClick }: GrinderCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 text-left p-4 rounded-lg bg-card border border-border hover:bg-card/80 transition-colors"
    >
      <EquipmentPhoto
        photoURL={grinder.photoURL}
        name={grinder.name}
        type="grinder"
        size="md"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{grinder.name}</h3>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          {grinder.brand && <span>{grinder.brand}</span>}
          {grinder.brand && grinder.type && (
            <span className="text-border">•</span>
          )}
          {grinder.type && <span className="capitalize">{grinder.type}</span>}
          {!grinder.brand && !grinder.type && (
            <span className="italic">No details</span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function GrindersPage() {
  const { grinders, loading } = useGrinders();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGrinder, setEditingGrinder] = useState<Grinder | null>(null);

  const handleAdd = () => {
    setEditingGrinder(null);
    setIsFormOpen(true);
  };

  const handleEdit = (grinder: Grinder) => {
    setEditingGrinder(grinder);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingGrinder(null);
  };

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Link
            href="/equipment"
            className="p-2 -ml-2 rounded-lg hover:bg-accent/10 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">My Grinders</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <LoadingSpinner />
        ) : grinders.length === 0 ? (
          <EmptyState onAdd={handleAdd} />
        ) : (
          <div className="space-y-3">
            {grinders.map((grinder) => (
              <GrinderCard
                key={grinder.id}
                grinder={grinder}
                onClick={() => handleEdit(grinder)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {!loading && grinders.length > 0 && (
        <button
          onClick={handleAdd}
          className="fixed bottom-20 right-4 w-14 h-14 bg-accent text-accent-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-accent/90 transition-colors"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      )}

      {/* Grinder Form Modal */}
      <GrinderForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        existingGrinder={editingGrinder}
      />
    </main>
  );
}
