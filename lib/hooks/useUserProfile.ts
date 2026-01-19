"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  getUserProfile,
  ensureUserProfile,
  updateProfileVisibility,
} from "@/lib/services/userProfileService";
import { UserProfile } from "@/lib/types/sharing";

interface UseUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Hook for fetching any user's profile
export function useUserProfile(userId: string | null): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setProfile(null);
      return;
    }

    let isMounted = true;
    const id = userId; // Capture non-null value

    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);

        const userProfile = await getUserProfile(id);

        if (isMounted) {
          setProfile(userProfile);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch profile"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [userId, refreshKey]);

  return { profile, loading, error, refetch };
}

interface UseCurrentUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  setPublic: (isPublic: boolean) => Promise<void>;
}

// Hook for current user's profile (creates if doesn't exist)
export function useCurrentUserProfile(): UseCurrentUserProfileResult {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      setProfile(null);
      return;
    }

    let isMounted = true;

    async function ensureProfile() {
      try {
        setLoading(true);
        setError(null);

        const userProfile = await ensureUserProfile(
          user!.uid,
          user!.displayName,
          user!.photoURL
        );

        if (isMounted) {
          setProfile(userProfile);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to load profile"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    ensureProfile();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, refreshKey]);

  const setPublic = useCallback(
    async (isPublic: boolean) => {
      if (!user || !profile) return;

      try {
        await updateProfileVisibility(user.uid, isPublic);
        setProfile((prev) => (prev ? { ...prev, isPublic } : null));
      } catch (err) {
        throw err;
      }
    },
    [user, profile]
  );

  return { profile, loading, error, refetch, setPublic };
}
