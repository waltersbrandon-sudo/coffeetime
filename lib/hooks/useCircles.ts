"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  getUserCircles,
  getCircle,
  getCircleMembers,
  getCircleBrews,
  createCircle,
  joinCircle,
  leaveCircle,
  postBrewToCircle,
  getUserCircleRole,
} from "@/lib/services/circleService";
import {
  Circle,
  CircleMember,
  CircleBrew,
  CircleRole,
  UserCircleMembership,
} from "@/lib/types/circles";
import { CoffeeTime } from "@/lib/types";

interface UseUserCirclesResult {
  circles: UserCircleMembership[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  create: (name: string, description: string | null) => Promise<Circle>;
  join: (inviteCode: string) => Promise<Circle>;
}

// Hook for user's circles list
export function useUserCircles(): UseUserCirclesResult {
  const { user } = useAuth();
  const [circles, setCircles] = useState<UserCircleMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setCircles([]);
      return;
    }

    let isMounted = true;

    async function fetchCircles() {
      try {
        setLoading(true);
        setError(null);

        const userCircles = await getUserCircles(user!.uid);

        if (isMounted) {
          setCircles(userCircles);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch circles"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCircles();

    return () => {
      isMounted = false;
    };
  }, [user, refreshKey]);

  const create = useCallback(
    async (name: string, description: string | null) => {
      if (!user) throw new Error("Not authenticated");

      const circle = await createCircle(user.uid, user.displayName, name, description);
      refetch();
      return circle;
    },
    [user, refetch]
  );

  const join = useCallback(
    async (inviteCode: string) => {
      if (!user) throw new Error("Not authenticated");

      const circle = await joinCircle(user.uid, user.displayName, inviteCode);
      refetch();
      return circle;
    },
    [user, refetch]
  );

  return { circles, loading, error, refetch, create, join };
}

interface UseCircleResult {
  circle: Circle | null;
  userRole: CircleRole | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  leave: () => Promise<void>;
}

// Hook for single circle
export function useCircle(circleId: string | null): UseCircleResult {
  const { user } = useAuth();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [userRole, setUserRole] = useState<CircleRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!circleId || !user) {
      setLoading(false);
      setCircle(null);
      setUserRole(null);
      return;
    }

    let isMounted = true;
    const id = circleId; // Capture non-null value

    async function fetchCircle() {
      try {
        setLoading(true);
        setError(null);

        const [circleData, role] = await Promise.all([
          getCircle(id),
          getUserCircleRole(user!.uid, id),
        ]);

        if (isMounted) {
          setCircle(circleData);
          setUserRole(role);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch circle"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCircle();

    return () => {
      isMounted = false;
    };
  }, [circleId, user, refreshKey]);

  const leave = useCallback(async () => {
    if (!user || !circleId) throw new Error("Not authenticated or no circle");

    await leaveCircle(user.uid, circleId);
    setCircle(null);
    setUserRole(null);
  }, [user, circleId]);

  return { circle, userRole, loading, error, refetch, leave };
}

interface UseCircleMembersResult {
  members: CircleMember[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Hook for circle members
export function useCircleMembers(circleId: string | null): UseCircleMembersResult {
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!circleId) {
      setLoading(false);
      setMembers([]);
      return;
    }

    let isMounted = true;
    const id = circleId; // Capture non-null value

    async function fetchMembers() {
      try {
        setLoading(true);
        setError(null);

        const memberList = await getCircleMembers(id);

        if (isMounted) {
          setMembers(memberList);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch members"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchMembers();

    return () => {
      isMounted = false;
    };
  }, [circleId, refreshKey]);

  return { members, loading, error, refetch };
}

interface UseCircleBrewsResult {
  brews: CircleBrew[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  postBrew: (brew: CoffeeTime) => Promise<void>;
}

// Hook for circle brews
export function useCircleBrews(circleId: string | null): UseCircleBrewsResult {
  const { user } = useAuth();
  const [brews, setBrews] = useState<CircleBrew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!circleId) {
      setLoading(false);
      setBrews([]);
      return;
    }

    let isMounted = true;
    const id = circleId; // Capture non-null value

    async function fetchBrews() {
      try {
        setLoading(true);
        setError(null);

        const brewList = await getCircleBrews(id);

        if (isMounted) {
          setBrews(brewList);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch brews"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchBrews();

    return () => {
      isMounted = false;
    };
  }, [circleId, refreshKey]);

  const postBrew = useCallback(
    async (brew: CoffeeTime) => {
      if (!user || !circleId) throw new Error("Not authenticated or no circle");

      await postBrewToCircle(user.uid, user.displayName, circleId, brew);
      refetch();
    },
    [user, circleId, refetch]
  );

  return { brews, loading, error, refetch, postBrew };
}
