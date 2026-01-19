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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUserCircles } from "@/lib/hooks/useCircles";

interface CreateCircleDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCircleDialog({ isOpen, onClose }: CreateCircleDialogProps) {
  const { toast } = useToast();
  const { create } = useUserCircles();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter a circle name");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const circle = await create(trimmedName, description.trim() || null);

      toast({
        title: "Circle created!",
        description: `Share invite code: ${circle.inviteCode}`,
      });

      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create circle";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Circle</DialogTitle>
          <DialogDescription>
            Create a coffee circle to share brews with friends.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Circle Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., Morning Brew Club"
                maxLength={50}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this circle about?"
                maxLength={200}
                rows={3}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Creating..." : "Create Circle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
