"use client";

import { useState, useEffect, useCallback } from "react";

export interface FeatureFlag {
  id: string;
  app_name: string;
  feature_name: string;
  enabled: boolean;
}

/**
 * Hook to load and toggle feature flags for a given app.
 * Returns a map of feature_name → enabled, plus a toggle function.
 */
export function useFeatureFlags(appName: string) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    try {
      const res = await fetch(`/api/feature-flags?app=${encodeURIComponent(appName)}`);
      if (!res.ok) return;
      const data = await res.json();
      setFlags(data.flags ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [appName]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const toggle = useCallback(
    async (featureName: string) => {
      const current = flags.find((f) => f.feature_name === featureName);
      const newEnabled = current ? !current.enabled : true;

      // Optimistic update
      setFlags((prev) =>
        prev.map((f) =>
          f.feature_name === featureName ? { ...f, enabled: newEnabled } : f
        )
      );

      try {
        await fetch("/api/feature-flags", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            app_name: appName,
            feature_name: featureName,
            enabled: newEnabled,
          }),
        });
      } catch {
        // Revert on error
        setFlags((prev) =>
          prev.map((f) =>
            f.feature_name === featureName ? { ...f, enabled: !newEnabled } : f
          )
        );
      }
    },
    [appName, flags]
  );

  /** Quick lookup: is feature X enabled? Defaults to true if not found. */
  const isEnabled = useCallback(
    (featureName: string): boolean => {
      const flag = flags.find((f) => f.feature_name === featureName);
      return flag ? flag.enabled : true;
    },
    [flags]
  );

  return { flags, loading, toggle, isEnabled, refetch: fetchFlags };
}
