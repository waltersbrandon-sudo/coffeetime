import { useEffect, useState, useCallback, useMemo } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/context/AuthContext";
import { Grinder } from "@/lib/types";
import { getCatalogGrinders } from "@/lib/data/catalog";

interface UseGrindersResult {
  grinders: Grinder[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useGrinders(): UseGrindersResult {
  const { user } = useAuth();
  const [userGrinders, setUserGrinders] = useState<Grinder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  // Get catalog grinders (static data available to all users)
  const catalogGrinders = useMemo(() => getCatalogGrinders(), []);

  useEffect(() => {
    if (!user) {
      setUserGrinders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const grindersRef = collection(db, "users", user.uid, "grinders");
    const q = query(grindersRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const grindersData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Grinder))
          .filter((grinder) => grinder.isActive !== false);
        setUserGrinders(grindersData);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, refetchTrigger]);

  // Merge user grinders with catalog grinders, sort alphabetically (brand → name)
  const grinders = useMemo(() => {
    const allGrinders = [...userGrinders, ...catalogGrinders];
    return allGrinders.sort((a, b) => {
      const brandA = (a.brand || "").toLowerCase();
      const brandB = (b.brand || "").toLowerCase();
      if (brandA !== brandB) {
        return brandA.localeCompare(brandB);
      }
      return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
    });
  }, [userGrinders, catalogGrinders]);

  return { grinders, loading, error, refetch };
}

interface UseGrinderResult {
  grinder: Grinder | null;
  loading: boolean;
  error: Error | null;
}

export function useGrinder(grinderId: string | null): UseGrinderResult {
  const { user } = useAuth();
  const [grinder, setGrinder] = useState<Grinder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get catalog grinders for fallback
  const catalogGrinders = useMemo(() => getCatalogGrinders(), []);

  useEffect(() => {
    if (!grinderId) {
      setGrinder(null);
      setLoading(false);
      return;
    }

    // Check if this is a catalog item
    if (grinderId.startsWith("catalog-")) {
      const catalogGrinder = catalogGrinders.find((g) => g.id === grinderId);
      setGrinder(catalogGrinder || null);
      setLoading(false);
      return;
    }

    if (!user) {
      setGrinder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const grinderRef = doc(db, "users", user.uid, "grinders", grinderId);

    const unsubscribe = onSnapshot(
      grinderRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setGrinder({
            id: snapshot.id,
            ...snapshot.data(),
          } as Grinder);
        } else {
          setGrinder(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, grinderId, catalogGrinders]);

  return { grinder, loading, error };
}
