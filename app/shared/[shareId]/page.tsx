"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePublicBrew } from "@/lib/hooks/usePublicBrew";
import { Timestamp } from "firebase/firestore";

// Icons
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

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <CoffeeIcon className="w-12 h-12 text-accent mb-4" />
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

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-xl font-semibold mb-2">Brew not found</h2>
      <p className="text-muted-foreground mb-6">
        This shared brew may have been removed or the link is invalid.
      </p>
      <Button asChild>
        <Link href="/">Try CoffeeTime</Link>
      </Button>
    </div>
  );
}

// Format helpers
function formatDateTime(timestamp: Timestamp | null | undefined): { date: string; time: string } {
  if (!timestamp) return { date: "Unknown date", time: "" };
  const date = timestamp.toDate();
  return {
    date: date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

function formatTime(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Rating display
function RatingDisplay({ rating }: { rating: number | null | undefined }) {
  if (!rating) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
        <StarIcon
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "text-accent" : "text-muted-foreground/20"
          }`}
          filled={star <= rating}
        />
      ))}
      <span className="ml-2 font-semibold">{rating}/10</span>
    </div>
  );
}

// Section component
interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </h2>
      <div className="bg-card rounded-lg border border-border p-4">
        {children}
      </div>
    </section>
  );
}

// Data row component
interface DataRowProps {
  label: string;
  value: React.ReactNode;
}

function DataRow({ label, value }: DataRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}

export default function SharedBrewPage() {
  const params = useParams();
  const shareId = params.shareId as string;

  const { publicBrew, loading, error } = usePublicBrew(shareId);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !publicBrew) {
    return <NotFound />;
  }

  const { brew, ownerDisplayName, viewCount } = publicBrew;
  const { date, time } = formatDateTime(brew.timestamp);

  return (
    <main className="min-h-screen pb-8">
      {/* Header */}
      <header className="bg-accent/10 border-b border-border">
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CoffeeIcon className="w-6 h-6 text-accent" />
            <span className="text-lg font-semibold">CoffeeTime</span>
          </div>
          {ownerDisplayName && (
            <p className="text-sm text-muted-foreground">
              Shared by {ownerDisplayName}
            </p>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Date/Time/Rating Header */}
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold">{brew.coffeeName || "Unknown Coffee"}</p>
          <p className="text-muted-foreground">{date} at {time}</p>
          {brew.rating && (
            <div className="flex justify-center pt-2">
              <RatingDisplay rating={brew.rating} />
            </div>
          )}
        </div>

        {/* Equipment Section */}
        <Section title="Equipment">
          <DataRow label="Coffee" value={brew.coffeeName} />
          <DataRow label="Grinder" value={brew.grinderName} />
          <DataRow label="Brewer" value={brew.brewerName} />
        </Section>

        {/* Parameters Section */}
        <Section title="Parameters">
          <DataRow label="Dose" value={brew.doseGrams ? `${brew.doseGrams}g` : null} />
          <DataRow label="Water" value={brew.waterGrams ? `${brew.waterGrams}g` : null} />
          <DataRow
            label="Ratio"
            value={brew.ratio ? `1:${brew.ratio.toFixed(1)}` : null}
          />
          <DataRow
            label="Temperature"
            value={
              brew.waterTempF || brew.waterTempC
                ? `${brew.waterTempF || "—"}°F / ${brew.waterTempC || "—"}°C`
                : null
            }
          />
          <DataRow label="Grind Setting" value={brew.grindSetting} />
        </Section>

        {/* Timing Section */}
        {(brew.bloomTimeSeconds || brew.bloomWaterGrams || brew.totalTimeSeconds) && (
          <Section title="Timing">
            {(brew.bloomTimeSeconds || brew.bloomWaterGrams) && (
              <DataRow
                label="Bloom"
                value={
                  brew.bloomTimeSeconds || brew.bloomWaterGrams
                    ? `${brew.bloomTimeSeconds || "—"}s with ${brew.bloomWaterGrams || "—"}g`
                    : null
                }
              />
            )}
            <DataRow label="Total Time" value={formatTime(brew.totalTimeSeconds)} />
          </Section>
        )}

        {/* Technique Notes */}
        {brew.techniqueNotes && (
          <Section title="Technique Notes">
            <p className="text-foreground whitespace-pre-wrap">{brew.techniqueNotes}</p>
          </Section>
        )}

        {/* Tasting Notes */}
        {brew.tastingNotes && (
          <Section title="Tasting Notes">
            <p className="text-foreground whitespace-pre-wrap italic">
              "{brew.tastingNotes}"
            </p>
          </Section>
        )}

        {/* View Count & CTA */}
        <div className="pt-4 border-t border-border text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Viewed {viewCount} {viewCount === 1 ? "time" : "times"}
          </p>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Start tracking your own brews
            </p>
            <Button asChild>
              <Link href="/">Try CoffeeTime</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
