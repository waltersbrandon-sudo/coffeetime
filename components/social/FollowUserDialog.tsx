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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFollowing } from "@/lib/hooks/useFollowing";

interface FollowUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FollowUserDialog({ isOpen, onClose }: FollowUserDialogProps) {
  const { toast } = useToast();
  const { follow } = useFollowing();

  const [profileCode, setProfileCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = profileCode.trim().toUpperCase();

    if (!code) {
      setError("Please enter a profile code");
      return;
    }

    if (code.length !== 6) {
      setError("Profile code should be 6 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await follow(code);

      toast({
        title: "Following!",
        description: "You are now following this user.",
      });

      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to follow user";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setProfileCode("");
    setError(null);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to uppercase and limit to 6 characters
    const value = e.target.value.toUpperCase().slice(0, 6);
    setProfileCode(value);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Follow Someone</DialogTitle>
          <DialogDescription>
            Enter their 6-character profile code to follow them and see their brews in your feed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profileCode">Profile Code</Label>
              <Input
                id="profileCode"
                value={profileCode}
                onChange={handleInputChange}
                placeholder="e.g., JAVA42"
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                autoComplete="off"
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              Ask your friend to share their profile code from Settings.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || profileCode.length !== 6}>
              {isLoading ? "Following..." : "Follow"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
