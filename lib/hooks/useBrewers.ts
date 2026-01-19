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
import { Brewer } from "@/lib/types";
import { getCatalogBrewers } from "@/lib/data/catalog";

interface UseBrewersResult {
  brewers: Brewer[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useBrewers(): UseBrewersResult {
  const { user } = useAuth();
  const [userBrewers, setUserBrewers] = useState<Brewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  // Get catalog brewers (static data available to all users)
  const catalogBrewers = useMemo(() => getCatalogBrewers(), []);

  useEffect(() => {
    if (!user) {
      setUserBrewers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const brewersRef = collection(db, "users", user.uid, "brewers");
    const q = query(brewersRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const brewersData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Brewer))
          .filter((brewer) => brewer.isActive !== false);
        setUserBrewers(brewersData);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, refetchTrigger]);

  // Merge user brewers with catalog brewers, sort alphabetically (brand → name)
  const brewers = useMemo(() => {
    const allBrewers = [...userBrewers, ...catalogBrewers];
    return allBrewers.sort((a, b) => {
      const brandA = (a.brand || "").toLowerCase();
      const brandB = (b.brand || "").toLowerCase();
      if (brandA !== brandB) {
        return brandA.localeCompare(brandB);
      }
      return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
    });
  }, [userBrewers, catalogBrewers]);

  return { brewers, loading, error, refetch };
}

interface UseBrewerResult {
  brewer: Brewer | null;
  loading: boolean;
  error: Error | null;
}

export function useBrewer(brewerId: string | null): UseBrewerResult {
  const { user } = useAuth();
  const [brewer, setBrewer] = useState<Brewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get catalog brewers for fallback
  const catalogBrewers = useMemo(() => getCatalogBrewers(), []);

  useEffect(() => {
    if (!brewerId) {
      setBrewer(null);
      setLoading(false);
      return;
    }

    // Check if this is a catalog item
    if (brewerId.startsWith("catalog-")) {
      const catalogBrewer = catalogBrewers.find((b) => b.id === brewerId);
      setBrewer(catalogBrewer || null);
      setLoading(false);
      return;
    }

    if (!user) {
      setBrewer(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const brewerRef = doc(db, "users", user.uid, "brewers", brewerId);

    const unsubscribe = onSnapshot(
      brewerRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setBrewer({
            id: snapshot.id,
            ...snapshot.data(),
          } as Brewer);
        } else {
          setBrewer(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, brewerId, catalogBrewers]);

  return { brewer, loading, error };
}
