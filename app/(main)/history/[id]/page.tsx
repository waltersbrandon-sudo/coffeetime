"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCoffeeTime } from "@/lib/hooks/useCoffeeTimes";
import { deleteCoffeeTime } from "@/lib/services/brewLogService";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BrewEditForm } from "@/components/brew/BrewEditForm";
import { ShareBrewDialog } from "@/components/brew/ShareBrewDialog";
import { PostToCircleDialog } from "@/components/circles/PostToCircleDialog";
import { Timestamp } from "firebase/firestore";

// Icons
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

function EditIcon({ className }: { className?: string }) {
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
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
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
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  );
}

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
    <div className="min-h-screen flex items-center justify-center">
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
        This brew may have been deleted or doesn't exist.
      </p>
      <Button asChild>
        <Link href="/history">Back to History</Link>
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
          className={`w-5 h-5 ${
            star <= rating ? "text-accent" : "text-muted-foreground/20"
          }`}
          filled={star <= rating}
        />
      ))}
      <span className="ml-2 text-lg font-semibold">{rating}/10</span>
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

export default function BrewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const brewId = params.id as string;

  const { coffeeTime: brew, loading } = useCoffeeTime(brewId);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPostToCircleOpen, setIsPostToCircleOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user || !brewId) return;

    setIsDeleting(true);
    try {
      await deleteCoffeeTime(user.uid, brewId);
      toast({
        title: "Brew deleted",
        description: "The brew has been removed from your history.",
      });
      router.push("/history");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete brew",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!brew) {
    return <NotFound />;
  }

  const { date, time } = formatDateTime(brew.timestamp);

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link
            href="/history"
            className="p-2 -ml-2 rounded-lg hover:bg-accent/10 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Brew Details</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsPostToCircleOpen(true)}
              className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
              title="Post to Circle"
            >
              <UsersIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsShareOpen(true)}
              className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
              title="Share"
            >
              <ShareIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsEditOpen(true)}
              className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
              title="Edit"
            >
              <EditIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
              title="Delete"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-6">
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
      </div>

      {/* Edit Modal */}
      <BrewEditForm
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        existingBrew={brew}
      />

      {/* Share Dialog */}
      <ShareBrewDialog
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        brew={brew}
      />

      {/* Post to Circle Dialog */}
      <PostToCircleDialog
        isOpen={isPostToCircleOpen}
        onClose={() => setIsPostToCircleOpen(false)}
        brew={brew}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this brew?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This brew will be permanently removed
              from your history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
