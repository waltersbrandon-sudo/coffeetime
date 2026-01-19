"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  getFollowing,
  getFollowers,
  getFollowingFeed,
  followUser,
  unfollowUser,
  isFollowing,
} from "@/lib/services/followService";
import { Following, Follower, FeedBrew } from "@/lib/types/sharing";

interface UseFollowingResult {
  following: Following[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  follow: (profileCode: string) => Promise<void>;
  unfollow: (userId: string) => Promise<void>;
}

// Hook for managing following list
export function useFollowing(): UseFollowingResult {
  const { user } = useAuth();
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setFollowing([]);
      return;
    }

    let isMounted = true;

    async function fetchFollowing() {
      try {
        setLoading(true);
        setError(null);

        const followingList = await getFollowing(user!.uid);

        if (isMounted) {
          setFollowing(followingList);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch following"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchFollowing();

    return () => {
      isMounted = false;
    };
  }, [user, refreshKey]);

  const follow = useCallback(
    async (profileCode: string) => {
      if (!user) throw new Error("Not authenticated");

      await followUser(user.uid, user.displayName, profileCode);
      refetch();
    },
    [user, refetch]
  );

  const unfollow = useCallback(
    async (userId: string) => {
      if (!user) throw new Error("Not authenticated");

      await unfollowUser(user.uid, userId);
      setFollowing((prev) => prev.filter((f) => f.id !== userId));
    },
    [user]
  );

  return { following, loading, error, refetch, follow, unfollow };
}

interface UseFollowersResult {
  followers: Follower[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Hook for fetching followers
export function useFollowers(): UseFollowersResult {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setFollowers([]);
      return;
    }

    let isMounted = true;

    async function fetchFollowers() {
      try {
        setLoading(true);
        setError(null);

        const followersList = await getFollowers(user!.uid);

        if (isMounted) {
          setFollowers(followersList);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch followers"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchFollowers();

    return () => {
      isMounted = false;
    };
  }, [user, refreshKey]);

  return { followers, loading, error, refetch };
}

interface UseFollowingFeedResult {
  feed: FeedBrew[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Hook for fetching the feed from followed users
export function useFollowingFeed(): UseFollowingFeedResult {
  const { user } = useAuth();
  const [feed, setFeed] = useState<FeedBrew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setFeed([]);
      return;
    }

    let isMounted = true;

    async function fetchFeed() {
      try {
        setLoading(true);
        setError(null);

        const feedData = await getFollowingFeed(user!.uid);

        if (isMounted) {
          setFeed(feedData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch feed"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchFeed();

    return () => {
      isMounted = false;
    };
  }, [user, refreshKey]);

  return { feed, loading, error, refetch };
}

interface UseIsFollowingResult {
  isFollowing: boolean;
  loading: boolean;
}

// Hook to check if current user is following another user
export function useIsFollowing(targetUserId: string | null): UseIsFollowingResult {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !targetUserId) {
      setLoading(false);
      setFollowing(false);
      return;
    }

    let isMounted = true;
    const targetId = targetUserId; // Capture non-null value

    async function checkFollowing() {
      try {
        setLoading(true);
        const result = await isFollowing(user!.uid, targetId);

        if (isMounted) {
          setFollowing(result);
        }
      } catch (error) {
        console.error("Error checking following status:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkFollowing();

    return () => {
      isMounted = false;
    };
  }, [user, targetUserId]);

  return { isFollowing: following, loading };
}
