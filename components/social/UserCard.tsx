"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Following } from "@/lib/types/sharing";

// User icon
function UserIcon({ className }: { className?: string }) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

interface UserCardProps {
  user: Following;
  onUnfollow: (userId: string) => Promise<void>;
}

export function UserCard({ user, onUnfollow }: UserCardProps) {
  const { toast } = useToast();
  const [isUnfollowing, setIsUnfollowing] = useState(false);

  const handleUnfollow = async () => {
    setIsUnfollowing(true);
    try {
      await onUnfollow(user.id);
      toast({
        title: "Unfollowed",
        description: `You are no longer following ${user.followedDisplayName || "this user"}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unfollow",
        variant: "destructive",
      });
    } finally {
      setIsUnfollowing(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-accent" />
        </div>
        <div>
          <p className="font-medium">
            {user.followedDisplayName || "Anonymous"}
          </p>
          <p className="text-sm text-muted-foreground font-mono">
            {user.followedProfileCode}
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleUnfollow}
        disabled={isUnfollowing}
      >
        {isUnfollowing ? "..." : "Unfollow"}
      </Button>
    </div>
  );
}
