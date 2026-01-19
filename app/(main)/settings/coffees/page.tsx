"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCoffees } from "@/lib/hooks/useCoffees";
import { Coffee } from "@/lib/types";
import { CoffeeForm } from "@/components/equipment/CoffeeForm";

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
      <div className="text-6xl mb-4">☕</div>
      <h3 className="text-lg font-semibold mb-2">No coffees yet</h3>
      <p className="text-muted-foreground mb-6 max-w-xs">
        Start tracking your coffee collection by adding your first bag.
      </p>
      <Button onClick={onAdd}>
        <PlusIcon className="w-4 h-4 mr-2" />
        Add your first coffee
      </Button>
    </div>
  );
}

interface CoffeeCardProps {
  coffee: Coffee;
  onClick: () => void;
}

function CoffeeCard({ coffee, onClick }: CoffeeCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg bg-card border border-border hover:bg-card/80 transition-colors"
    >
      <h3 className="font-medium truncate">{coffee.name}</h3>
      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
        {coffee.roaster && <span>{coffee.roaster}</span>}
        {coffee.roaster && coffee.origin && (
          <span className="text-border">•</span>
        )}
        {coffee.origin && <span>{coffee.origin}</span>}
        {!coffee.roaster && !coffee.origin && (
          <span className="italic">No details</span>
        )}
      </div>
    </button>
  );
}

export default function CoffeesPage() {
  const { coffees, loading } = useCoffees();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoffee, setEditingCoffee] = useState<Coffee | null>(null);

  const handleAdd = () => {
    setEditingCoffee(null);
    setIsFormOpen(true);
  };

  const handleEdit = (coffee: Coffee) => {
    setEditingCoffee(coffee);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCoffee(null);
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
          <h1 className="text-xl font-bold">My Coffees</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <LoadingSpinner />
        ) : coffees.length === 0 ? (
          <EmptyState onAdd={handleAdd} />
        ) : (
          <div className="space-y-3">
            {coffees.map((coffee) => (
              <CoffeeCard
                key={coffee.id}
                coffee={coffee}
                onClick={() => handleEdit(coffee)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {!loading && coffees.length > 0 && (
        <button
          onClick={handleAdd}
          className="fixed bottom-20 right-4 w-14 h-14 bg-accent text-accent-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-accent/90 transition-colors"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      )}

      {/* Coffee Form Modal */}
      <CoffeeForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        existingCoffee={editingCoffee}
      />
    </main>
  );
}
