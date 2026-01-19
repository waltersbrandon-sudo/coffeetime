"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCircle, useCircleMembers, useCircleBrews } from "@/lib/hooks/useCircles";
import { CircleBrewCard } from "@/components/circles/CircleBrewCard";
import { CircleMember, CircleRole } from "@/lib/types/circles";

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
      <h2 className="text-xl font-semibold mb-2">Circle not found</h2>
      <p className="text-muted-foreground mb-6">
        This circle may have been deleted or you don't have access.
      </p>
      <Button asChild>
        <Link href="/circles">Back to Circles</Link>
      </Button>
    </div>
  );
}

function MemberCard({ member }: { member: CircleMember }) {
  const roleLabels: Record<CircleRole, string> = {
    admin: "Admin",
    contributor: "Contributor",
    viewer: "Viewer",
  };

  const roleColors: Record<CircleRole, string> = {
    admin: "text-accent",
    contributor: "text-muted-foreground",
    viewer: "text-muted-foreground",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
        <UserIcon className="w-5 h-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{member.displayName || "Anonymous"}</p>
        <p className={`text-sm ${roleColors[member.role]}`}>
          {roleLabels[member.role]}
        </p>
      </div>
    </div>
  );
}

function EmptyBrews() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <CoffeeIcon className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No brews yet</h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        Be the first to share a brew with this circle!
      </p>
    </div>
  );
}

export default function CircleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const circleId = params.circleId as string;

  const { circle, userRole, loading, leave } = useCircle(circleId);
  const { members, loading: membersLoading } = useCircleMembers(circleId);
  const { brews, loading: brewsLoading } = useCircleBrews(circleId);

  const [activeTab, setActiveTab] = useState("brews");
  const [copied, setCopied] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleCopyInviteCode = async () => {
    if (!circle?.inviteCode) return;

    try {
      await navigator.clipboard.writeText(circle.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Please copy the code manually.",
        variant: "destructive",
      });
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await leave();
      toast({
        title: "Left circle",
        description: "You have left this circle.",
      });
      router.push("/circles");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to leave circle",
        variant: "destructive",
      });
    } finally {
      setIsLeaving(false);
      setIsLeaveDialogOpen(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!circle || !userRole) {
    return <NotFound />;
  }

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Link
              href="/circles"
              className="p-2 -ml-2 rounded-lg hover:bg-accent/10 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold">{circle.name}</h1>
              <p className="text-xs text-muted-foreground">
                {circle.memberCount} members
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
            <TabsTrigger
              value="brews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-4 py-3"
            >
              Brews ({circle.brewCount})
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-4 py-3"
            >
              Members
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-4 py-3"
            >
              Info
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Content */}
      <div className="p-4">
        {activeTab === "brews" ? (
          brewsLoading ? (
            <div className="flex justify-center py-8">
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          ) : brews.length === 0 ? (
            <EmptyBrews />
          ) : (
            <div className="space-y-4">
              {brews.map((brew) => (
                <CircleBrewCard
                  key={brew.id}
                  circleBrew={brew}
                  circleId={circleId}
                  circleName={circle?.name || "Circle"}
                  showImportButton
                />
              ))}
            </div>
          )
        ) : activeTab === "members" ? (
          membersLoading ? (
            <div className="flex justify-center py-8">
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          )
        ) : (
          <div className="space-y-6">
            {/* Circle Info */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">{circle.name}</h2>
              {circle.description && (
                <p className="text-muted-foreground">{circle.description}</p>
              )}
            </div>

            {/* Invite Code */}
            <div className="p-4 rounded-lg bg-card border border-border space-y-2">
              <p className="text-sm text-muted-foreground">Invite Code</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-mono font-bold tracking-widest">
                  {circle.inviteCode}
                </p>
                <button
                  onClick={handleCopyInviteCode}
                  className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
                >
                  {copied ? (
                    <CheckIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <CopyIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this code to invite others to join.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-card border border-border text-center">
                <p className="text-2xl font-bold">{circle.memberCount}</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border text-center">
                <p className="text-2xl font-bold">{circle.brewCount}</p>
                <p className="text-sm text-muted-foreground">Brews</p>
              </div>
            </div>

            {/* Leave Button */}
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => setIsLeaveDialogOpen(true)}
            >
              Leave Circle
            </Button>
          </div>
        )}
      </div>

      {/* Leave Confirmation Dialog */}
      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave this circle?</DialogTitle>
            <DialogDescription>
              You will no longer see brews from this circle. You can rejoin
              anytime with the invite code.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsLeaveDialogOpen(false)}
              disabled={isLeaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeave}
              disabled={isLeaving}
            >
              {isLeaving ? "Leaving..." : "Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
