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
import { Search, X, Filter, Star, Clock } from "lucide-react";

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

function RatingDisplay({ rating }: { rating: number | null | undefined }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 text-accent fill-accent" />
      <span className="text-sm font-medium">{rating}/10</span>
    </div>
  );
}

function formatTime(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return "Unknown date";
  const date = timestamp.toDate();
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: now.getFullYear() !== date.getFullYear() ? "numeric" : undefined,
  });
}

function formatTimeOfDay(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return "";
  return timestamp.toDate().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
        active ? "bg-accent text-accent-foreground" : "bg-card border border-border hover:bg-card/80"
      }`}
    >
      {label}
    </button>
  );
}

function BrewCard({ brew, onClick }: { brew: CoffeeTime; onClick: () => void }) {
  const coffeeName = brew.coffeeName || "Unknown coffee";
  const hasStats = brew.doseGrams || brew.waterGrams || brew.totalTimeSeconds;
  const isImported = brew.importedFrom != null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl bg-card border border-border hover:border-accent/50 hover:bg-card/80 transition-all"
    >
      {isImported && brew.importedFrom && (
        <div className="mb-2">
          <ImportedBrewBadge importedFrom={brew.importedFrom} compact />
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{formatDate(brew.timestamp)}</span>
          <span>•</span>
          <span>{formatTimeOfDay(brew.timestamp)}</span>
        </div>
        <RatingDisplay rating={brew.rating} />
      </div>

      <h3 className="font-semibold text-lg mb-1 truncate">{coffeeName}</h3>

      {brew.brewerName && (
        <p className="text-sm text-muted-foreground mb-3">{brew.brewerName}</p>
      )}

      {hasStats && (
        <div className="flex items-center gap-4 text-sm mb-3">
          {(brew.doseGrams || brew.waterGrams) && (
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{brew.doseGrams ? `${brew.doseGrams}g` : "—"}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium">{brew.waterGrams ? `${brew.waterGrams}g` : "—"}</span>
              {brew.ratio && <span className="text-muted-foreground ml-1">(1:{brew.ratio.toFixed(1)})</span>}
            </div>
          )}
          {brew.totalTimeSeconds && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(brew.totalTimeSeconds)}</span>
            </div>
          )}
        </div>
      )}

      {brew.tastingNotes && (
        <p className="text-sm text-muted-foreground line-clamp-2 italic">&quot;{brew.tastingNotes}&quot;</p>
      )}
    </button>
  );
}

type DateRange = "all" | "today" | "week" | "month";
type RatingFilter = "all" | "7+" | "8+" | "9+";

export default function HistoryContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [coffeeFilter, setCoffeeFilter] = useState<string>("all");
  const [brewerFilter, setBrewerFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");

  const { coffees } = useCoffees();
  const { brewers } = useBrewers();
  const { coffeeTimes, loading, loadingMore, hasMore, loadMore } = useInfiniteCoffeeTimes({ pageSize: 50 });

  const getDateRangeBoundary = (range: DateRange): Date | null => {
    if (range === "all") return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    switch (range) {
      case "today": return new Date(now);
      case "week": const w = new Date(now); w.setDate(w.getDate() - 7); return w;
      case "month": const m = new Date(now); m.setMonth(m.getMonth() - 1); return m;
      default: return null;
    }
  };

  const filteredBrews = useMemo(() => {
    let result = coffeeTimes;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((brew) =>
        (brew.coffeeName || "").toLowerCase().includes(query) ||
        (brew.tastingNotes || "").toLowerCase().includes(query)
      );
    }

    const dateBoundary = getDateRangeBoundary(dateRange);
    if (dateBoundary) {
      result = result.filter((brew) => brew.timestamp && brew.timestamp.toDate() >= dateBoundary);
    }

    if (coffeeFilter !== "all") result = result.filter((brew) => brew.coffeeId === coffeeFilter);
    if (brewerFilter !== "all") result = result.filter((brew) => brew.brewerId === brewerFilter);

    const minRating = ratingFilter === "7+" ? 7 : ratingFilter === "8+" ? 8 : ratingFilter === "9+" ? 9 : null;
    if (minRating) result = result.filter((brew) => (brew.rating || 0) >= minRating);

    return result;
  }, [coffeeTimes, searchQuery, dateRange, coffeeFilter, brewerFilter, ratingFilter]);

  const activeFilterCount = [searchQuery.trim(), dateRange !== "all", coffeeFilter !== "all", brewerFilter !== "all", ratingFilter !== "all"].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery("");
    setDateRange("all");
    setCoffeeFilter("all");
    setBrewerFilter("all");
    setRatingFilter("all");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (coffeeTimes.length === 0) return <EmptyState />;

  return (
    <div>
      {/* Filters */}
      <div className="p-4 space-y-3 border-b border-border">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search brews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 bg-card"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              showFilters || activeFilterCount > 0 ? "bg-accent text-accent-foreground" : "bg-card border border-border"
            }`}
          >
            <Filter className="w-4 h-4" />
            {activeFilterCount > 0 && <span className="text-xs font-bold">{activeFilterCount}</span>}
          </button>
        </div>

        {showFilters && (
          <div className="space-y-3 pt-2">
            <div className="flex gap-2 flex-wrap">
              {(["all", "today", "week", "month"] as DateRange[]).map((range) => (
                <FilterChip
                  key={range}
                  label={range === "all" ? "All Time" : range === "today" ? "Today" : range === "week" ? "This Week" : "This Month"}
                  active={dateRange === range}
                  onClick={() => setDateRange(range)}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select value={coffeeFilter} onValueChange={setCoffeeFilter}>
                <SelectTrigger className="bg-card"><SelectValue placeholder="All coffees" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All coffees</SelectItem>
                  {coffees.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={brewerFilter} onValueChange={setBrewerFilter}>
                <SelectTrigger className="bg-card"><SelectValue placeholder="All brewers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All brewers</SelectItem>
                  {brewers.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 flex-wrap">
              {(["all", "7+", "8+", "9+"] as RatingFilter[]).map((r) => (
                <FilterChip key={r} label={r === "all" ? "Any Rating" : r} active={ratingFilter === r} onClick={() => setRatingFilter(r)} />
              ))}
            </div>

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="w-full">Clear all filters</Button>
            )}
          </div>
        )}
      </div>

      {/* Brew List */}
      <div className="p-4 space-y-3">
        {filteredBrews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No matches found</p>
            <Button variant="outline" onClick={clearAllFilters}>Clear filters</Button>
          </div>
        ) : (
          <>
            {filteredBrews.map((brew) => (
              <BrewCard key={brew.id} brew={brew} onClick={() => router.push(`/history/${brew.id}`)} />
            ))}
            {hasMore && activeFilterCount === 0 && (
              <Button onClick={loadMore} disabled={loadingMore} variant="outline" className="w-full mt-4">
                {loadingMore ? "Loading..." : "Load more"}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
