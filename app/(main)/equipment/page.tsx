"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useGrinders } from "@/lib/hooks/useGrinders";
import { useBrewers } from "@/lib/hooks/useBrewers";
import { useEquipmentStats } from "@/lib/hooks/useEquipmentStats";
import { Grinder, Brewer } from "@/lib/types";
import { GrinderForm } from "@/components/equipment/GrinderForm";
import { BrewerForm } from "@/components/equipment/BrewerForm";
import { EquipmentPhoto } from "@/components/equipment/EquipmentPhoto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addGrinder } from "@/lib/services/grinderService";
import { addBrewer } from "@/lib/services/brewerService";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Icons
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

function ChevronRightIcon({ className }: { className?: string }) {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
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
      <path d="m6 9 6 6 6-6" />
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

interface EquipmentCardProps {
  item: { id: string; name: string; subtitle?: string; photoURL?: string | null; thumbnailURL?: string | null };
  type: "grinder" | "brewer";
  onClick: () => void;
  brewCount?: number;
  showAddButton?: boolean;
  onAdd?: () => void;
  isAdding?: boolean;
}

function EquipmentCard({ item, type, onClick, brewCount, showAddButton, onAdd, isAdding }: EquipmentCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-border/80 transition-colors">
      <button
        onClick={onClick}
        className="flex-1 flex items-center gap-3 text-left hover:opacity-90 transition-opacity"
      >
        <EquipmentPhoto
          photoURL={item.photoURL}
          thumbnailURL={item.thumbnailURL}
          name={item.name}
          type={type}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{item.name}</p>
          {item.subtitle && (
            <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
          )}
        </div>
      </button>
      {brewCount !== undefined && brewCount > 0 && (
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full shrink-0">
          {brewCount}
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

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon, count, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            {icon}
          </div>
          <div className="text-left">
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{count} item{count !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <div className="border-t border-border">{children}</div>}
    </div>
  );
}

export default function EquipmentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { grinders, loading: grindersLoading, refetch: refetchGrinders } = useGrinders();
  const { brewers, loading: brewersLoading, refetch: refetchBrewers } = useBrewers();
  const { stats } = useEquipmentStats();

  const [grinderFormOpen, setGrinderFormOpen] = useState(false);
  const [brewerFormOpen, setBrewerFormOpen] = useState(false);

  const [editingGrinder, setEditingGrinder] = useState<Grinder | null>(null);
  const [editingBrewer, setEditingBrewer] = useState<Brewer | null>(null);

  const [grinderSearch, setGrinderSearch] = useState("");
  const [brewerSearch, setBrewerSearch] = useState("");

  const [addingGrinderId, setAddingGrinderId] = useState<string | null>(null);
  const [addingBrewerId, setAddingBrewerId] = useState<string | null>(null);

  const loading = grindersLoading || brewersLoading;

  // Separate user grinders from catalog
  const { userGrinders, catalogGrinders } = useMemo(() => {
    const userItems: Grinder[] = [];
    const catalogItems: Grinder[] = [];

    for (const grinder of grinders) {
      if (grinder.id.startsWith("catalog-") || grinder.isCatalogItem) {
        catalogItems.push(grinder);
      } else {
        userItems.push(grinder);
      }
    }

    return { userGrinders: userItems, catalogGrinders: catalogItems };
  }, [grinders]);

  // Separate user brewers from catalog
  const { userBrewers, catalogBrewers } = useMemo(() => {
    const userItems: Brewer[] = [];
    const catalogItems: Brewer[] = [];

    for (const brewer of brewers) {
      if (brewer.id.startsWith("catalog-") || brewer.isCatalogItem) {
        catalogItems.push(brewer);
      } else {
        userItems.push(brewer);
      }
    }

    return { userBrewers: userItems, catalogBrewers: catalogItems };
  }, [brewers]);

  // Sort user items by usage
  const sortedUserGrinders = useMemo(() => {
    return [...userGrinders].sort((a, b) => {
      const aCount = stats?.grinders?.[a.id]?.count || 0;
      const bCount = stats?.grinders?.[b.id]?.count || 0;
      if (bCount !== aCount) return bCount - aCount;
      return a.name.localeCompare(b.name);
    });
  }, [userGrinders, stats]);

  const sortedUserBrewers = useMemo(() => {
    return [...userBrewers].sort((a, b) => {
      const aCount = stats?.brewers?.[a.id]?.count || 0;
      const bCount = stats?.brewers?.[b.id]?.count || 0;
      if (bCount !== aCount) return bCount - aCount;
      return a.name.localeCompare(b.name);
    });
  }, [userBrewers, stats]);

  // Filter catalog items by search
  const filteredCatalogGrinders = useMemo(() => {
    if (!grinderSearch.trim()) return catalogGrinders;
    const search = grinderSearch.toLowerCase();
    return catalogGrinders.filter(
      (g) =>
        g.name.toLowerCase().includes(search) ||
        g.brand?.toLowerCase().includes(search)
    );
  }, [catalogGrinders, grinderSearch]);

  const filteredCatalogBrewers = useMemo(() => {
    if (!brewerSearch.trim()) return catalogBrewers;
    const search = brewerSearch.toLowerCase();
    return catalogBrewers.filter(
      (b) =>
        b.name.toLowerCase().includes(search) ||
        b.brand?.toLowerCase().includes(search)
    );
  }, [catalogBrewers, brewerSearch]);

  // Handlers
  const handleAddGrinder = () => {
    setEditingGrinder(null);
    setGrinderFormOpen(true);
  };

  const handleEditGrinder = (grinder: Grinder) => {
    if (grinder.id.startsWith("catalog-")) {
      toast({
        title: "Catalog Item",
        description: "Add this grinder to your collection to customize it.",
      });
      return;
    }
    setEditingGrinder(grinder);
    setGrinderFormOpen(true);
  };

  const handleAddGrinderFromCatalog = async (grinder: Grinder) => {
    if (!user) return;

    setAddingGrinderId(grinder.id);
    try {
      await addGrinder(user.uid, {
        name: grinder.name,
        brand: grinder.brand,
        model: grinder.model,
        type: grinder.type,
        burrType: grinder.burrType,
        burrSize: grinder.burrSize,
        settingsMin: grinder.settingsMin,
        settingsMax: grinder.settingsMax,
        settingsType: grinder.settingsType,
        notes: grinder.notes,
        photoURL: grinder.photoURL,
      });
      toast({
        title: "Grinder added",
        description: `${grinder.name} has been added to your collection.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add grinder to your collection.",
        variant: "destructive",
      });
    } finally {
      setAddingGrinderId(null);
    }
  };

  const handleAddBrewer = () => {
    setEditingBrewer(null);
    setBrewerFormOpen(true);
  };

  const handleEditBrewer = (brewer: Brewer) => {
    if (brewer.id.startsWith("catalog-")) {
      toast({
        title: "Catalog Item",
        description: "Add this brewer to your collection to customize it.",
      });
      return;
    }
    setEditingBrewer(brewer);
    setBrewerFormOpen(true);
  };

  const handleAddBrewerFromCatalog = async (brewer: Brewer) => {
    if (!user) return;

    setAddingBrewerId(brewer.id);
    try {
      await addBrewer(user.uid, {
        name: brewer.name,
        brand: brewer.brand,
        type: brewer.type,
        material: brewer.material,
        capacityMl: brewer.capacityMl,
        filterType: brewer.filterType,
        notes: brewer.notes,
        photoURL: brewer.photoURL,
      });
      toast({
        title: "Brewer added",
        description: `${brewer.name} has been added to your collection.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add brewer to your collection.",
        variant: "destructive",
      });
    } finally {
      setAddingBrewerId(null);
    }
  };

  const getGrinderBrewCount = (id: string) => stats?.grinders?.[id]?.count || 0;
  const getBrewerBrewCount = (id: string) => stats?.brewers?.[id]?.count || 0;

  // Calculate totals
  const totalEquipment = userGrinders.length + userBrewers.length;
  const totalUsage = Object.values(stats.grinders).reduce((sum, s) => sum + s.count, 0) +
    Object.values(stats.brewers).reduce((sum, s) => sum + s.count, 0);

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="p-4">
          <h1 className="text-2xl font-bold">Equipment</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalEquipment} item{totalEquipment !== 1 ? "s" : ""} in your collection
            {totalUsage > 0 && ` • ${totalUsage} brews`}
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-6">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Grinders Section */}
            <CollapsibleSection
              title="Grinders"
              icon={<GrinderIcon className="w-5 h-5" />}
              count={userGrinders.length}
              defaultOpen={true}
            >
              <div className="p-4 space-y-4">
                {/* My Grinders */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm">My Collection</h3>
                    <Button size="sm" variant="outline" onClick={handleAddGrinder}>
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {userGrinders.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No grinders added yet. Add one or browse the catalog below.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sortedUserGrinders.map((grinder) => (
                        <EquipmentCard
                          key={grinder.id}
                          item={{
                            id: grinder.id,
                            name: grinder.name,
                            subtitle: grinder.brand || grinder.type || undefined,
                            photoURL: grinder.photoURL,
                            thumbnailURL: grinder.thumbnailURL,
                          }}
                          type="grinder"
                          onClick={() => handleEditGrinder(grinder)}
                          brewCount={getGrinderBrewCount(grinder.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Catalog Grinders */}
                <div className="border-t border-border pt-4">
                  <h3 className="font-medium text-sm mb-3">Browse Catalog ({catalogGrinders.length})</h3>
                  <div className="relative mb-3">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search grinders..."
                      value={grinderSearch}
                      onChange={(e) => setGrinderSearch(e.target.value)}
                      className="pl-10 h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {filteredCatalogGrinders.slice(0, 10).map((grinder) => (
                      <EquipmentCard
                        key={grinder.id}
                        item={{
                          id: grinder.id,
                          name: grinder.name,
                          subtitle: grinder.brand || grinder.type || undefined,
                          photoURL: grinder.photoURL,
                          thumbnailURL: grinder.thumbnailURL,
                        }}
                        type="grinder"
                        onClick={() => handleEditGrinder(grinder)}
                        showAddButton
                        onAdd={() => handleAddGrinderFromCatalog(grinder)}
                        isAdding={addingGrinderId === grinder.id}
                      />
                    ))}
                    {filteredCatalogGrinders.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Showing 10 of {filteredCatalogGrinders.length}. Search to find more.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Brewers Section */}
            <CollapsibleSection
              title="Brewers"
              icon={<BrewerIcon className="w-5 h-5" />}
              count={userBrewers.length}
              defaultOpen={true}
            >
              <div className="p-4 space-y-4">
                {/* My Brewers */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm">My Collection</h3>
                    <Button size="sm" variant="outline" onClick={handleAddBrewer}>
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {userBrewers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No brewers added yet. Add one or browse the catalog below.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sortedUserBrewers.map((brewer) => (
                        <EquipmentCard
                          key={brewer.id}
                          item={{
                            id: brewer.id,
                            name: brewer.name,
                            subtitle: brewer.brand || brewer.type || undefined,
                            photoURL: brewer.photoURL,
                            thumbnailURL: brewer.thumbnailURL,
                          }}
                          type="brewer"
                          onClick={() => handleEditBrewer(brewer)}
                          brewCount={getBrewerBrewCount(brewer.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Catalog Brewers */}
                <div className="border-t border-border pt-4">
                  <h3 className="font-medium text-sm mb-3">Browse Catalog ({catalogBrewers.length})</h3>
                  <div className="relative mb-3">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search brewers..."
                      value={brewerSearch}
                      onChange={(e) => setBrewerSearch(e.target.value)}
                      className="pl-10 h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {filteredCatalogBrewers.slice(0, 10).map((brewer) => (
                      <EquipmentCard
                        key={brewer.id}
                        item={{
                          id: brewer.id,
                          name: brewer.name,
                          subtitle: brewer.brand || brewer.type || undefined,
                          photoURL: brewer.photoURL,
                          thumbnailURL: brewer.thumbnailURL,
                        }}
                        type="brewer"
                        onClick={() => handleEditBrewer(brewer)}
                        showAddButton
                        onAdd={() => handleAddBrewerFromCatalog(brewer)}
                        isAdding={addingBrewerId === brewer.id}
                      />
                    ))}
                    {filteredCatalogBrewers.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Showing 10 of {filteredCatalogBrewers.length}. Search to find more.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </>
        )}
      </div>

      {/* Forms */}
      <GrinderForm
        isOpen={grinderFormOpen}
        onClose={() => {
          setGrinderFormOpen(false);
          setEditingGrinder(null);
          // Refetch to ensure thumbnails are updated
          refetchGrinders();
        }}
        existingGrinder={editingGrinder}
      />

      <BrewerForm
        isOpen={brewerFormOpen}
        onClose={() => {
          setBrewerFormOpen(false);
          setEditingBrewer(null);
          // Refetch to ensure thumbnails are updated
          refetchBrewers();
        }}
        existingBrewer={editingBrewer}
      />
    </main>
  );
}
