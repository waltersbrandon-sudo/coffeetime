"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  createPublicShare,
  getPublicShareByBrewId,
  deletePublicShare,
} from "@/lib/services/shareService";
import { CoffeeTime } from "@/lib/types";
import { PublicBrew } from "@/lib/types/sharing";

// Icons
function LinkIcon({ className }: { className?: string }) {
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
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
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
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

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
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
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
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

interface ShareBrewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  brew: CoffeeTime;
}

export function ShareBrewDialog({ isOpen, onClose, brew }: ShareBrewDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [existingShare, setExistingShare] = useState<PublicBrew | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check for existing share when dialog opens
  useEffect(() => {
    if (!isOpen || !user) {
      return;
    }

    async function checkExistingShare() {
      setIsLoading(true);
      try {
        const share = await getPublicShareByBrewId(user!.uid, brew.id);
        setExistingShare(share);
      } catch (error) {
        console.error("Error checking existing share:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkExistingShare();
  }, [isOpen, user, brew.id]);

  const getShareUrl = (shareId: string) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/shared/${shareId}`;
  };

  const handleCreateShare = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      const shareId = await createPublicShare(
        user.uid,
        user.displayName,
        brew
      );

      // Fetch the created share
      const share = await getPublicShareByBrewId(user.uid, brew.id);
      setExistingShare(share);

      toast({
        title: "Share link created",
        description: "Anyone with the link can now view this brew.",
      });

      // Auto-copy to clipboard
      await copyToClipboard(shareId);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create share link",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteShare = async () => {
    if (!user || !existingShare) return;

    setIsDeleting(true);
    try {
      await deletePublicShare(user.uid, existingShare.shareId);
      setExistingShare(null);

      toast({
        title: "Share link removed",
        description: "The share link has been deactivated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove share link",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = async (shareId?: string) => {
    const id = shareId || existingShare?.shareId;
    if (!id) return;

    const url = getShareUrl(id);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      if (!shareId) {
        toast({
          title: "Link copied",
          description: "The share link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Brew</DialogTitle>
          <DialogDescription>
            Create a public link to share this brew with anyone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
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
          ) : existingShare ? (
            <div className="space-y-4">
              {/* Share URL display */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate flex-1">
                  {getShareUrl(existingShare.shareId)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard()}
                  className="shrink-0"
                >
                  {copied ? (
                    <CheckIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <CopyIcon className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* View count */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <EyeIcon className="w-4 h-4" />
                <span>
                  {existingShare.viewCount} {existingShare.viewCount === 1 ? "view" : "views"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => copyToClipboard()}
                >
                  <CopyIcon className="w-4 h-4 mr-2" />
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDeleteShare}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <div className="py-6">
                <LinkIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Create a public link that anyone can use to view this brew.
                  No login required.
                </p>
              </div>
              <Button onClick={handleCreateShare} disabled={isCreating} className="w-full">
                {isCreating ? "Creating..." : "Create Share Link"}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
