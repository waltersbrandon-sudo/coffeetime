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
import { useUserCircles } from "@/lib/hooks/useCircles";
import { getCircleByInviteCode } from "@/lib/services/circleService";
import { Circle } from "@/lib/types/circles";

interface JoinCircleDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinCircleDialog({ isOpen, onClose }: JoinCircleDialogProps) {
  const { toast } = useToast();
  const { join } = useUserCircles();

  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [previewCircle, setPreviewCircle] = useState<Circle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    const code = inviteCode.trim().toUpperCase();

    if (!code || code.length !== 8) {
      setError("Please enter a valid 8-character invite code");
      return;
    }

    setIsLookingUp(true);
    setError(null);

    try {
      const circle = await getCircleByInviteCode(code);

      if (!circle) {
        setError("No circle found with that invite code");
        setPreviewCircle(null);
      } else {
        setPreviewCircle(circle);
      }
    } catch (err) {
      setError("Failed to look up circle");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleJoin = async () => {
    if (!previewCircle) return;

    setIsLoading(true);
    setError(null);

    try {
      await join(inviteCode.trim().toUpperCase());

      toast({
        title: "Joined circle!",
        description: `Welcome to ${previewCircle.name}`,
      });

      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to join circle";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInviteCode("");
    setPreviewCircle(null);
    setError(null);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 8);
    setInviteCode(value);
    setError(null);
    setPreviewCircle(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Circle</DialogTitle>
          <DialogDescription>
            Enter an invite code to join a coffee circle.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <div className="flex gap-2">
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={handleInputChange}
                placeholder="e.g., AB3XY7KM"
                className="text-center text-xl tracking-widest font-mono"
                maxLength={8}
                autoComplete="off"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleLookup}
                disabled={isLookingUp || inviteCode.length !== 8}
              >
                {isLookingUp ? "..." : "Look Up"}
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {previewCircle && (
            <div className="p-4 rounded-lg bg-muted space-y-2">
              <p className="font-medium text-lg">{previewCircle.name}</p>
              {previewCircle.description && (
                <p className="text-sm text-muted-foreground">
                  {previewCircle.description}
                </p>
              )}
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{previewCircle.memberCount} members</span>
                <span>{previewCircle.brewCount} brews</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleJoin}
            disabled={isLoading || !previewCircle}
          >
            {isLoading ? "Joining..." : "Join Circle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
