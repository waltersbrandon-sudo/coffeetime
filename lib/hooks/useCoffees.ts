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
import { Coffee } from "@/lib/types";
import { getCatalogCoffees } from "@/lib/data/catalog";

interface UseCoffeesResult {
  coffees: Coffee[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCoffees(): UseCoffeesResult {
  const { user } = useAuth();
  const [userCoffees, setUserCoffees] = useState<Coffee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  // Get catalog coffees (static data available to all users)
  const catalogCoffees = useMemo(() => getCatalogCoffees(), []);

  useEffect(() => {
    if (!user) {
      setUserCoffees([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const coffeesRef = collection(db, "users", user.uid, "coffees");
    const q = query(coffeesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const coffeesData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Coffee))
          .filter((coffee) => coffee.isActive !== false);
        setUserCoffees(coffeesData);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, refetchTrigger]);

  // Merge user coffees with catalog coffees, sort alphabetically (roaster → name)
  const coffees = useMemo(() => {
    const allCoffees = [...userCoffees, ...catalogCoffees];
    return allCoffees.sort((a, b) => {
      const roasterA = (a.roaster || "").toLowerCase();
      const roasterB = (b.roaster || "").toLowerCase();
      if (roasterA !== roasterB) {
        return roasterA.localeCompare(roasterB);
      }
      return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
    });
  }, [userCoffees, catalogCoffees]);

  return { coffees, loading, error, refetch };
}

interface UseCoffeeResult {
  coffee: Coffee | null;
  loading: boolean;
  error: Error | null;
}

export function useCoffee(coffeeId: string | null): UseCoffeeResult {
  const { user } = useAuth();
  const [coffee, setCoffee] = useState<Coffee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get catalog coffees for fallback
  const catalogCoffees = useMemo(() => getCatalogCoffees(), []);

  useEffect(() => {
    if (!coffeeId) {
      setCoffee(null);
      setLoading(false);
      return;
    }

    // Check if this is a catalog item
    if (coffeeId.startsWith("catalog-")) {
      const catalogCoffee = catalogCoffees.find((c) => c.id === coffeeId);
      setCoffee(catalogCoffee || null);
      setLoading(false);
      return;
    }

    if (!user) {
      setCoffee(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const coffeeRef = doc(db, "users", user.uid, "coffees", coffeeId);

    const unsubscribe = onSnapshot(
      coffeeRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setCoffee({
            id: snapshot.id,
            ...snapshot.data(),
          } as Coffee);
        } else {
          setCoffee(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, coffeeId, catalogCoffees]);

  return { coffee, loading, error };
}
