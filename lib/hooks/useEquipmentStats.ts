import { useEffect, useState, useCallback } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/context/AuthContext";
import { EquipmentStats } from "@/lib/types/equipmentStats";

interface UseEquipmentStatsResult {
  stats: EquipmentStats;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

const emptyStats: EquipmentStats = {
  coffees: {},
  grinders: {},
  brewers: {},
};

export function useEquipmentStats(): UseEquipmentStatsResult {
  const { user } = useAuth();
  const [stats, setStats] = useState<EquipmentStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!user) {
      setStats(emptyStats);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const statsRef = doc(db, "users", user.uid, "equipmentStats", "stats");

    const unsubscribe = onSnapshot(
      statsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setStats(snapshot.data() as EquipmentStats);
        } else {
          setStats(emptyStats);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, refetchTrigger]);

  return { stats, loading, error, refetch };
}
