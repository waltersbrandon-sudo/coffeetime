"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInfiniteCoffeeTimes } from "@/lib/hooks/useCoffeeTimes";
import { useCoffees } from "@/lib/hooks/useCoffees";
import { useBrewers } from "@/lib/hooks/useBrewers";
import { CoffeeTime } from "@/lib/types";
import { Timestamp } from "firebase/firestore";
import { ImportedBrewBadge } from "@/components/brew/ImportedBrewBadge";

// Icons
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

function XIcon({ className }: { className?: string }) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
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
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">📝</div>
      <h3 className="text-lg font-semibold mb-2">No brews yet</h3>
      <p className="text-muted-foreground max-w-xs">
        Start logging your coffee brews to see them here.
      </p>
    </div>
  );
}

function NoResultsState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-lg font-semibold mb-2">No matches found</h3>
      <p className="text-muted-foreground max-w-xs mb-4">
        Try adjusting your search or filters to find what you're looking for.
      </p>
      <Button variant="outline" onClick={onClear}>
        Clear all filters
      </Button>
    </div>
  );
}

// Rating display component
function RatingDisplay({ rating }: { rating: number | null | undefined }) {
  if (!rating) return null;

  if (rating <= 5) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating ? "text-accent" : "text-muted-foreground/30"
            }`}
            filled={star <= rating}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <StarIcon className="w-3.5 h-3.5 text-accent" filled />
      <span className="text-sm font-medium">{rating}/10</span>
    </div>
  );
}

// Format time in seconds to mm:ss
function formatTime(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Format timestamp to date string
function formatDate(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return "Unknown date";
  const date = timestamp.toDate();
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: now.getFullYear() !== date.getFullYear() ? "numeric" : undefined,
    });
  }
}

function formatTimeOfDay(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return "";
  return timestamp.toDate().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Filter chip component
interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? "bg-accent text-accent-foreground"
          : "bg-card border border-border hover:bg-card/80"
      }`}
    >
      {label}
    </button>
  );
}

interface BrewCardProps {
  brew: CoffeeTime;
  onClick: () => void;
}

function BrewCard({ brew, onClick }: BrewCardProps) {
  const coffeeName = brew.coffeeName || "Unknown coffee";
  const hasStats = brew.doseGrams || brew.waterGrams || brew.totalTimeSeconds;
  const isImported = brew.importedFrom != null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl bg-card border border-border hover:border-accent/50 hover:bg-card/80 transition-all duration-200"
    >
      {/* Imported Badge */}
      {isImported && brew.importedFrom && (
        <div className="mb-2">
          <ImportedBrewBadge importedFrom={brew.importedFrom} compact />
        </div>
      )}

      {/* Header: Date/Time and Rating */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{formatDate(brew.timestamp)}</span>
          <span className="text-border">•</span>
          <span>{formatTimeOfDay(brew.timestamp)}</span>
        </div>
        <RatingDisplay rating={brew.rating} />
      </div>

      {/* Coffee Name */}
      <h3 className="font-semibold text-lg mb-1 truncate">{coffeeName}</h3>

      {/* Brewer */}
      {brew.brewerName && (
        <p className="text-sm text-muted-foreground mb-3">{brew.brewerName}</p>
      )}

      {/* Stats Row */}
      {hasStats && (
        <div className="flex items-center gap-4 text-sm mb-3">
          {(brew.doseGrams || brew.waterGrams) && (
            <div className="flex items-center gap-1.5">
              <span className="text-foreground font-medium">
                {brew.doseGrams ? `${brew.doseGrams}g` : "—"}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-foreground font-medium">
                {brew.waterGrams ? `${brew.waterGrams}g` : "—"}
              </span>
              {brew.ratio && (
                <span className="text-muted-foreground ml-1">
                  (1:{brew.ratio.toFixed(1)})
                </span>
              )}
            </div>
          )}
          {brew.totalTimeSeconds && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{formatTime(brew.totalTimeSeconds)}</span>
            </div>
          )}
        </div>
      )}

      {/* Tasting Notes Preview */}
      {brew.tastingNotes && (
        <p className="text-sm text-muted-foreground line-clamp-2 italic">
          "{brew.tastingNotes}"
        </p>
      )}
    </button>
  );
}

type DateRange = "all" | "today" | "week" | "month";
type RatingFilter = "all" | "7+" | "8+" | "9+";
type SourceFilter = "all" | "mine" | "imported";

export default function HistoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [coffeeFilter, setCoffeeFilter] = useState<string>("all");
  const [brewerFilter, setBrewerFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  const { coffees } = useCoffees();
  const { brewers } = useBrewers();
  const {
    coffeeTimes,
    loading,
    loadingMore,
    hasMore,
    loadMore,
  } = useInfiniteCoffeeTimes({ pageSize: 50 }); // Load more for client-side filtering

  // Calculate date range boundaries
  const getDateRangeBoundary = (range: DateRange): Date | null => {
    if (range === "all") return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    switch (range) {
      case "today":
        return now;
      case "week":
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo;
      case "month":
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return monthAgo;
      default:
        return null;
    }
  };

  // Get minimum rating from filter
  const getMinRating = (filter: RatingFilter): number | null => {
    switch (filter) {
      case "7+": return 7;
      case "8+": return 8;
      case "9+": return 9;
      default: return null;
    }
  };

  // Filter brews
  const filteredBrews = useMemo(() => {
    let result = coffeeTimes;

    // Search filter (coffee name, tasting notes)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((brew) => {
        const coffeeName = (brew.coffeeName || "").toLowerCase();
        const tastingNotes = (brew.tastingNotes || "").toLowerCase();
        const techniqueNotes = (brew.techniqueNotes || "").toLowerCase();
        return (
          coffeeName.includes(query) ||
          tastingNotes.includes(query) ||
          techniqueNotes.includes(query)
        );
      });
    }

    // Date range filter
    const dateBoundary = getDateRangeBoundary(dateRange);
    if (dateBoundary) {
      result = result.filter((brew) => {
        if (!brew.timestamp) return false;
        return brew.timestamp.toDate() >= dateBoundary;
      });
    }

    // Coffee filter
    if (coffeeFilter !== "all") {
      result = result.filter((brew) => brew.coffeeId === coffeeFilter);
    }

    // Brewer filter
    if (brewerFilter !== "all") {
      result = result.filter((brew) => brew.brewerId === brewerFilter);
    }

    // Rating filter
    const minRating = getMinRating(ratingFilter);
    if (minRating !== null) {
      result = result.filter((brew) => (brew.rating || 0) >= minRating);
    }

    // Source filter (imported vs mine)
    if (sourceFilter === "imported") {
      result = result.filter((brew) => brew.importedFrom != null);
    } else if (sourceFilter === "mine") {
      result = result.filter((brew) => brew.importedFrom == null);
    }

    return result;
  }, [coffeeTimes, searchQuery, dateRange, coffeeFilter, brewerFilter, ratingFilter, sourceFilter]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (dateRange !== "all") count++;
    if (coffeeFilter !== "all") count++;
    if (brewerFilter !== "all") count++;
    if (ratingFilter !== "all") count++;
    if (sourceFilter !== "all") count++;
    return count;
  }, [searchQuery, dateRange, coffeeFilter, brewerFilter, ratingFilter, sourceFilter]);

  const clearAllFilters = () => {
    setSearchQuery("");
    setDateRange("all");
    setCoffeeFilter("all");
    setBrewerFilter("all");
    setRatingFilter("all");
    setSourceFilter("all");
  };

  const handleBrewClick = (brew: CoffeeTime) => {
    router.push(`/history/${brew.id}`);
  };

  const hasAnyBrews = coffeeTimes.length > 0;
  const hasFilteredResults = filteredBrews.length > 0;
  const isFiltering = activeFilterCount > 0;

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">History</h1>
            {hasAnyBrews && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  showFilters || isFiltering
                    ? "bg-accent text-accent-foreground"
                    : "bg-card border border-border hover:bg-card/80"
                }`}
              >
                <FilterIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-background text-foreground text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Search Bar */}
          {hasAnyBrews && (
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search coffee, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 bg-card"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Filter Panel */}
          {showFilters && hasAnyBrews && (
            <div className="space-y-4 pt-2">
              {/* Date Range Chips */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date Range
                </label>
                <div className="flex gap-2 flex-wrap">
                  <FilterChip
                    label="All Time"
                    active={dateRange === "all"}
                    onClick={() => setDateRange("all")}
                  />
                  <FilterChip
                    label="Today"
                    active={dateRange === "today"}
                    onClick={() => setDateRange("today")}
                  />
                  <FilterChip
                    label="This Week"
                    active={dateRange === "week"}
                    onClick={() => setDateRange("week")}
                  />
                  <FilterChip
                    label="This Month"
                    active={dateRange === "month"}
                    onClick={() => setDateRange("month")}
                  />
                </div>
              </div>

              {/* Coffee & Brewer Dropdowns */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Coffee
                  </label>
                  <Select value={coffeeFilter} onValueChange={setCoffeeFilter}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="All coffees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All coffees</SelectItem>
                      {coffees.map((coffee) => (
                        <SelectItem key={coffee.id} value={coffee.id}>
                          {coffee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Brewer
                  </label>
                  <Select value={brewerFilter} onValueChange={setBrewerFilter}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="All brewers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All brewers</SelectItem>
                      {brewers.map((brewer) => (
                        <SelectItem key={brewer.id} value={brewer.id}>
                          {brewer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Rating Chips */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Rating
                </label>
                <div className="flex gap-2 flex-wrap">
                  <FilterChip
                    label="Any"
                    active={ratingFilter === "all"}
                    onClick={() => setRatingFilter("all")}
                  />
                  <FilterChip
                    label="7+"
                    active={ratingFilter === "7+"}
                    onClick={() => setRatingFilter("7+")}
                  />
                  <FilterChip
                    label="8+"
                    active={ratingFilter === "8+"}
                    onClick={() => setRatingFilter("8+")}
                  />
                  <FilterChip
                    label="9+"
                    active={ratingFilter === "9+"}
                    onClick={() => setRatingFilter("9+")}
                  />
                </div>
              </div>

              {/* Source Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Source
                </label>
                <div className="flex gap-2 flex-wrap">
                  <FilterChip
                    label="All"
                    active={sourceFilter === "all"}
                    onClick={() => setSourceFilter("all")}
                  />
                  <FilterChip
                    label="My Brews"
                    active={sourceFilter === "mine"}
                    onClick={() => setSourceFilter("mine")}
                  />
                  <FilterChip
                    label="Imported"
                    active={sourceFilter === "imported"}
                    onClick={() => setSourceFilter("imported")}
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="w-full text-muted-foreground"
                >
                  <XIcon className="w-4 h-4 mr-2" />
                  Clear all filters
                </Button>
              )}
            </div>
          )}

          {/* Active Filters Summary (when collapsed) */}
          {!showFilters && activeFilterCount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {filteredBrews.length} {filteredBrews.length === 1 ? "brew" : "brews"} found
              </span>
              <button
                onClick={clearAllFilters}
                className="text-accent hover:text-accent/80 font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <LoadingSpinner />
        ) : !hasAnyBrews ? (
          <EmptyState />
        ) : !hasFilteredResults && isFiltering ? (
          <NoResultsState onClear={clearAllFilters} />
        ) : (
          <div className="space-y-3">
            {filteredBrews.map((brew) => (
              <BrewCard
                key={brew.id}
                brew={brew}
                onClick={() => handleBrewClick(brew)}
              />
            ))}

            {/* Load More Button - only show if not filtering much and there's more */}
            {hasMore && !isFiltering && (
              <div className="pt-4">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="w-full"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
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
                      Loading...
                    </span>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            )}

            {/* End of list indicator */}
            {((!hasMore && !isFiltering) || (isFiltering && hasFilteredResults)) && filteredBrews.length > 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                {isFiltering
                  ? `Showing ${filteredBrews.length} ${filteredBrews.length === 1 ? "brew" : "brews"}`
                  : "You've reached the end"}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
