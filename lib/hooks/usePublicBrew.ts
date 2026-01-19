"use client";

import { useState, useEffect } from "react";
import { getPublicBrew, incrementViewCount } from "@/lib/services/shareService";
import { PublicBrew } from "@/lib/types/sharing";

interface UsePublicBrewResult {
  publicBrew: PublicBrew | null;
  loading: boolean;
  error: Error | null;
}

export function usePublicBrew(shareId: string | null): UsePublicBrewResult {
  const [publicBrew, setPublicBrew] = useState<PublicBrew | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!shareId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const id = shareId; // Capture non-null value

    async function fetchPublicBrew() {
      try {
        setLoading(true);
        setError(null);

        const brew = await getPublicBrew(id);

        if (isMounted) {
          setPublicBrew(brew);

          // Increment view count in background (don't await)
          if (brew) {
            incrementViewCount(id).catch(console.error);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch brew"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPublicBrew();

    return () => {
      isMounted = false;
    };
  }, [shareId]);

  return { publicBrew, loading, error };
}
