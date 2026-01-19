import { useEffect, useState, useCallback, useMemo } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDocs,
  startAfter,
  QueryConstraint,
  Timestamp,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/context/AuthContext";
import { CoffeeTime } from "@/lib/types";

export interface CoffeeTimesFilterOptions {
  startDate?: Date;
  endDate?: Date;
  coffeeId?: string;
  brewerId?: string;
  grinderId?: string;
  minRating?: number;
  pageSize?: number;
}

interface UseCoffeeTimesResult {
  coffeeTimes: CoffeeTime[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCoffeeTimes(
  options: CoffeeTimesFilterOptions = {}
): UseCoffeeTimesResult {
  const { user } = useAuth();
  const [coffeeTimes, setCoffeeTimes] = useState<CoffeeTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const {
    startDate,
    endDate,
    coffeeId,
    brewerId,
    grinderId,
    minRating,
    pageSize = 50,
  } = options;

  const optionsKey = useMemo(
    () =>
      JSON.stringify({
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        coffeeId,
        brewerId,
        grinderId,
        minRating,
        pageSize,
      }),
    [startDate, endDate, coffeeId, brewerId, grinderId, minRating, pageSize]
  );

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!user) {
      setCoffeeTimes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const brewLogsRef = collection(db, "users", user.uid, "brewLogs");
    const constraints: QueryConstraint[] = [];

    if (startDate) {
      constraints.push(where("timestamp", ">=", Timestamp.fromDate(startDate)));
    }

    if (endDate) {
      constraints.push(where("timestamp", "<=", Timestamp.fromDate(endDate)));
    }

    if (coffeeId) {
      constraints.push(where("coffeeId", "==", coffeeId));
    }

    if (brewerId) {
      constraints.push(where("brewerId", "==", brewerId));
    }

    if (grinderId) {
      constraints.push(where("grinderId", "==", grinderId));
    }

    if (minRating !== undefined) {
      constraints.push(where("rating", ">=", minRating));
    }

    constraints.push(orderBy("timestamp", "desc"));
    constraints.push(limit(pageSize));

    const q = query(brewLogsRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const coffeeTimesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CoffeeTime[];
        setCoffeeTimes(coffeeTimesData);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, optionsKey, refetchTrigger]);

  return { coffeeTimes, loading, error, refetch };
}

interface UseCoffeeTimeResult {
  coffeeTime: CoffeeTime | null;
  loading: boolean;
  error: Error | null;
}

export function useCoffeeTime(brewLogId: string | null): UseCoffeeTimeResult {
  const { user } = useAuth();
  const [coffeeTime, setCoffeeTime] = useState<CoffeeTime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user || !brewLogId) {
      setCoffeeTime(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const brewLogRef = doc(db, "users", user.uid, "brewLogs", brewLogId);

    const unsubscribe = onSnapshot(
      brewLogRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setCoffeeTime({
            id: snapshot.id,
            ...snapshot.data(),
          } as CoffeeTime);
        } else {
          setCoffeeTime(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, brewLogId]);

  return { coffeeTime, loading, error };
}

interface UseInfiniteCoffeeTimesResult {
  coffeeTimes: CoffeeTime[];
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => void;
}

export function useInfiniteCoffeeTimes(
  options: CoffeeTimesFilterOptions = {}
): UseInfiniteCoffeeTimesResult {
  const { user } = useAuth();
  const [coffeeTimes, setCoffeeTimes] = useState<CoffeeTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const {
    startDate,
    endDate,
    coffeeId,
    brewerId,
    grinderId,
    minRating,
    pageSize = 20,
  } = options;

  const optionsKey = useMemo(
    () =>
      JSON.stringify({
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        coffeeId,
        brewerId,
        grinderId,
        minRating,
        pageSize,
      }),
    [startDate, endDate, coffeeId, brewerId, grinderId, minRating, pageSize]
  );

  const refetch = useCallback(() => {
    setCoffeeTimes([]);
    setLastDoc(null);
    setHasMore(true);
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  const buildConstraints = useCallback((): QueryConstraint[] => {
    const constraints: QueryConstraint[] = [];

    if (startDate) {
      constraints.push(where("timestamp", ">=", Timestamp.fromDate(startDate)));
    }

    if (endDate) {
      constraints.push(where("timestamp", "<=", Timestamp.fromDate(endDate)));
    }

    if (coffeeId) {
      constraints.push(where("coffeeId", "==", coffeeId));
    }

    if (brewerId) {
      constraints.push(where("brewerId", "==", brewerId));
    }

    if (grinderId) {
      constraints.push(where("grinderId", "==", grinderId));
    }

    if (minRating !== undefined) {
      constraints.push(where("rating", ">=", minRating));
    }

    constraints.push(orderBy("timestamp", "desc"));

    return constraints;
  }, [startDate, endDate, coffeeId, brewerId, grinderId, minRating]);

  useEffect(() => {
    if (!user) {
      setCoffeeTimes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const brewLogsRef = collection(db, "users", user.uid, "brewLogs");
    const constraints = buildConstraints();
    constraints.push(limit(pageSize + 1));

    const q = query(brewLogsRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs;
        const hasMoreDocs = docs.length > pageSize;
        const resultDocs = hasMoreDocs ? docs.slice(0, pageSize) : docs;

        const coffeeTimesData = resultDocs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CoffeeTime[];

        setCoffeeTimes(coffeeTimesData);
        setLastDoc(resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null);
        setHasMore(hasMoreDocs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, optionsKey, pageSize, buildConstraints, refetchTrigger]);

  const loadMore = useCallback(async () => {
    if (!user || !lastDoc || loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const brewLogsRef = collection(db, "users", user.uid, "brewLogs");
      const constraints = buildConstraints();
      constraints.push(startAfter(lastDoc));
      constraints.push(limit(pageSize + 1));

      const q = query(brewLogsRef, ...constraints);
      const snapshot = await getDocs(q);

      const docs = snapshot.docs;
      const hasMoreDocs = docs.length > pageSize;
      const resultDocs = hasMoreDocs ? docs.slice(0, pageSize) : docs;

      const newCoffeeTimes = resultDocs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CoffeeTime[];

      setCoffeeTimes((prev) => [...prev, ...newCoffeeTimes]);
      setLastDoc(resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null);
      setHasMore(hasMoreDocs);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load more"));
    } finally {
      setLoadingMore(false);
    }
  }, [user, lastDoc, loadingMore, hasMore, buildConstraints, pageSize]);

  return {
    coffeeTimes,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}
