"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFollowing, useFollowingFeed } from "@/lib/hooks/useFollowing";
import { FollowUserDialog } from "@/components/social/FollowUserDialog";
import { UserCard } from "@/components/social/UserCard";
import { FeedBrewCard } from "@/components/social/FeedBrewCard";

// Icons
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

function PlusIcon({ className }: { className?: string }) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
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

function RefreshIcon({ className }: { className?: string }) {
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
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
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

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <CoffeeIcon className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Your feed is empty</h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        Follow other coffee enthusiasts to see their brews here. Ask them to share their profile code!
      </p>
    </div>
  );
}

function EmptyFollowing() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <UsersIcon className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Not following anyone</h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        Follow friends by entering their profile code. You'll see their brews in your feed.
      </p>
    </div>
  );
}

export default function FollowingPage() {
  const [isFollowDialogOpen, setIsFollowDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");

  const { following, loading: followingLoading, unfollow } = useFollowing();
  const { feed, loading: feedLoading, refetch: refetchFeed } = useFollowingFeed();

  const handleRefresh = () => {
    refetchFeed();
  };

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-semibold">Social</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
            >
              <RefreshIcon className="w-5 h-5" />
            </button>
            <Button
              onClick={() => setIsFollowDialogOpen(true)}
              size="sm"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Follow
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
            <TabsTrigger
              value="feed"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-4 py-3"
            >
              Feed
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-4 py-3"
            >
              Following ({following.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Content */}
      <div className="p-4">
        {activeTab === "feed" ? (
          feedLoading ? (
            <LoadingSpinner />
          ) : feed.length === 0 ? (
            <EmptyFeed />
          ) : (
            <div className="space-y-4">
              {feed.map((feedBrew) => (
                <FeedBrewCard key={feedBrew.id} feedBrew={feedBrew} />
              ))}
            </div>
          )
        ) : followingLoading ? (
          <LoadingSpinner />
        ) : following.length === 0 ? (
          <EmptyFollowing />
        ) : (
          <div className="space-y-3">
            {following.map((user) => (
              <UserCard key={user.id} user={user} onUnfollow={unfollow} />
            ))}
          </div>
        )}
      </div>

      {/* Follow Dialog */}
      <FollowUserDialog
        isOpen={isFollowDialogOpen}
        onClose={() => setIsFollowDialogOpen(false)}
      />
    </main>
  );
}
