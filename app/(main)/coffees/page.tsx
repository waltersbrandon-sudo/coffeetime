"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCoffees } from "@/lib/hooks/useCoffees";
import { useEquipmentStats } from "@/lib/hooks/useEquipmentStats";
import { Coffee } from "@/lib/types";
import { CoffeeForm } from "@/components/equipment/CoffeeForm";
import { EquipmentPhoto } from "@/components/equipment/EquipmentPhoto";
import { addCoffee } from "@/lib/services/coffeeService";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

function SearchIcon({ className }: { className?: string }) {
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
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
        Add your first coffee or browse the catalog below.
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
  brewCount?: number;
  onClick: () => void;
  showAddButton?: boolean;
  onAdd?: () => void;
  isAdding?: boolean;
}

function CoffeeCard({ coffee, brewCount, onClick, showAddButton, onAdd, isAdding }: CoffeeCardProps) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-border/80 transition-colors">
      <button
        onClick={onClick}
        className="flex-1 flex items-center gap-3 text-left hover:opacity-90 transition-opacity"
      >
        <EquipmentPhoto
          photoURL={coffee.photoURL}
          thumbnailURL={coffee.thumbnailURL}
          name={coffee.name}
          type="coffee"
          size="xl"
        />
        <div className="flex-1 min-w-0">
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
        </div>
      </button>
      {brewCount !== undefined && brewCount > 0 && (
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full shrink-0">
          {brewCount} {brewCount === 1 ? "brew" : "brews"}
        </div>
      )}
      {showAddButton && onAdd && (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          disabled={isAdding}
          className="shrink-0"
        >
          {isAdding ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <>
              <PlusIcon className="w-4 h-4 mr-1" />
              Add
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export default function CoffeesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { coffees, loading } = useCoffees();
  const { stats } = useEquipmentStats();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoffee, setEditingCoffee] = useState<Coffee | null>(null);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [addingCoffeeId, setAddingCoffeeId] = useState<string | null>(null);

  // Separate user coffees from catalog coffees
  const { userCoffees, catalogCoffees } = useMemo(() => {
    const user: Coffee[] = [];
    const catalog: Coffee[] = [];

    for (const coffee of coffees) {
      if (coffee.id.startsWith("catalog-") || coffee.isCatalogItem) {
        catalog.push(coffee);
      } else {
        user.push(coffee);
      }
    }

    return { userCoffees: user, catalogCoffees: catalog };
  }, [coffees]);

  // Sort user coffees by usage (most used first), then alphabetically
  const sortedUserCoffees = useMemo(() => {
    return [...userCoffees].sort((a, b) => {
      const aCount = stats?.coffees?.[a.id]?.count || 0;
      const bCount = stats?.coffees?.[b.id]?.count || 0;
      if (bCount !== aCount) return bCount - aCount;
      return a.name.localeCompare(b.name);
    });
  }, [userCoffees, stats]);

  // Filter catalog coffees by search
  const filteredCatalogCoffees = useMemo(() => {
    if (!catalogSearch.trim()) return catalogCoffees;
    const search = catalogSearch.toLowerCase();
    return catalogCoffees.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.roaster?.toLowerCase().includes(search) ||
        c.origin?.toLowerCase().includes(search)
    );
  }, [catalogCoffees, catalogSearch]);

  const handleAdd = () => {
    setEditingCoffee(null);
    setIsFormOpen(true);
  };

  const handleEdit = (coffee: Coffee) => {
    // Can't edit catalog items directly, but can view them
    if (coffee.id.startsWith("catalog-")) {
      // For catalog items, show a toast suggesting to add it
      toast({
        title: "Catalog Item",
        description: "Add this coffee to your collection to customize it.",
      });
      return;
    }
    setEditingCoffee(coffee);
    setIsFormOpen(true);
  };

  const handleAddFromCatalog = async (coffee: Coffee) => {
    if (!user) return;

    setAddingCoffeeId(coffee.id);
    try {
      await addCoffee(user.uid, {
        name: coffee.name,
        roaster: coffee.roaster,
        origin: coffee.origin,
        region: coffee.region,
        process: coffee.process,
        variety: coffee.variety,
        roastLevel: coffee.roastLevel,
        flavorNotes: coffee.flavorNotes,
        notes: coffee.notes,
        photoURL: coffee.photoURL,
      });
      toast({
        title: "Coffee added",
        description: `${coffee.name} has been added to your collection.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add coffee to your collection.",
        variant: "destructive",
      });
    } finally {
      setAddingCoffeeId(null);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCoffee(null);
  };

  const getBrewCount = (coffeeId: string) => {
    return stats?.coffees?.[coffeeId]?.count || 0;
  };

  const totalBrews = userCoffees.reduce((sum, c) => sum + getBrewCount(c.id), 0);

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Coffees</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {loading ? "..." : `${userCoffees.length} coffees • ${totalBrews} brews`}
            </p>
          </div>
          <Button onClick={handleAdd} size="sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 space-y-6">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* My Coffees Section */}
            <section>
              <h2 className="text-lg font-semibold mb-3">My Collection</h2>
              {userCoffees.length === 0 ? (
                <EmptyState onAdd={handleAdd} />
              ) : (
                <div className="space-y-3">
                  {sortedUserCoffees.map((coffee) => (
                    <CoffeeCard
                      key={coffee.id}
                      coffee={coffee}
                      brewCount={getBrewCount(coffee.id)}
                      onClick={() => handleEdit(coffee)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Catalog Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Browse Catalog</h2>
                <span className="text-sm text-muted-foreground">
                  {catalogCoffees.length} coffees
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Discover popular coffees and add them to your collection.
              </p>

              {/* Search */}
              <div className="relative mb-4">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search coffees..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Catalog List */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredCatalogCoffees.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No coffees found matching "{catalogSearch}"
                  </p>
                ) : (
                  filteredCatalogCoffees.map((coffee) => (
                    <CoffeeCard
                      key={coffee.id}
                      coffee={coffee}
                      onClick={() => handleEdit(coffee)}
                      showAddButton
                      onAdd={() => handleAddFromCatalog(coffee)}
                      isAdding={addingCoffeeId === coffee.id}
                    />
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Coffee Form Modal */}
      <CoffeeForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        existingCoffee={editingCoffee}
      />
    </main>
  );
}
