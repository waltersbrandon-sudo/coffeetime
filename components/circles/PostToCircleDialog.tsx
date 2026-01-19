"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUserCircles } from "@/lib/hooks/useCircles";
import { postBrewToCircle } from "@/lib/services/circleService";
import { useAuth } from "@/lib/context/AuthContext";
import { CoffeeTime } from "@/lib/types";

// Icons
function CheckIcon({ className }: { className?: string }) {
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
      <path d="M20 6 9 17l-5-5" />
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

interface PostToCircleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  brew: CoffeeTime;
}

export function PostToCircleDialog({ isOpen, onClose, brew }: PostToCircleDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { circles, loading } = useUserCircles();

  const [selectedCircles, setSelectedCircles] = useState<Set<string>>(new Set());
  const [isPosting, setIsPosting] = useState(false);

  const toggleCircle = (circleId: string) => {
    setSelectedCircles((prev) => {
      const next = new Set(prev);
      if (next.has(circleId)) {
        next.delete(circleId);
      } else {
        next.add(circleId);
      }
      return next;
    });
  };

  const handlePost = async () => {
    if (!user || selectedCircles.size === 0) return;

    setIsPosting(true);

    try {
      const promises = Array.from(selectedCircles).map((circleId) =>
        postBrewToCircle(user.uid, user.displayName, circleId, brew)
      );

      await Promise.all(promises);

      toast({
        title: "Posted!",
        description: `Brew shared to ${selectedCircles.size} circle${selectedCircles.size > 1 ? "s" : ""}.`,
      });

      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to post brew",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleClose = () => {
    setSelectedCircles(new Set());
    onClose();
  };

  // Filter to circles where user can post (admin or contributor)
  const postableCircles = circles.filter(
    (c) => c.role === "admin" || c.role === "contributor"
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post to Circles</DialogTitle>
          <DialogDescription>
            Share "{brew.coffeeName || "this brew"}" with your coffee circles.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg
                className="animate-spin h-6 w-6 text-accent"
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
          ) : postableCircles.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                You're not a member of any circles yet.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Create or join a circle from Settings.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {postableCircles.map((circle) => (
                <button
                  key={circle.id}
                  onClick={() => toggleCircle(circle.id)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg border transition-colors
                    ${
                      selectedCircles.has(circle.id)
                        ? "border-accent bg-accent/10"
                        : "border-border hover:bg-muted"
                    }
                  `}
                >
                  <div
                    className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center
                      ${
                        selectedCircles.has(circle.id)
                          ? "border-accent bg-accent text-white"
                          : "border-muted-foreground"
                      }
                    `}
                  >
                    {selectedCircles.has(circle.id) && (
                      <CheckIcon className="w-3 h-3" />
                    )}
                  </div>
                  <span className="font-medium">{circle.circleName}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handlePost}
            disabled={isPosting || selectedCircles.size === 0}
          >
            {isPosting
              ? "Posting..."
              : `Post to ${selectedCircles.size || ""} Circle${selectedCircles.size !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
