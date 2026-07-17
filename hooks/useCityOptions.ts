"use client";

import { useCallback, useEffect, useState } from "react";
import { useCities } from "@/components/CitiesProvider";

type AdminCityRow = { name: string };

export function useCityOptions(includeAllCities = false) {
  const { cities: publicCities, loading: publicLoading } = useCities();
  const [allCities, setAllCities] = useState<string[]>([]);
  const [allLoading, setAllLoading] = useState(false);

  const refreshAllCities = useCallback(async () => {
    if (!includeAllCities) return;

    setAllLoading(true);
    try {
      const res = await fetch("/api/admin/cities");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setAllCities((data as AdminCityRow[]).map((city) => city.name));
      }
    } catch {
      /* keep previous */
    } finally {
      setAllLoading(false);
    }
  }, [includeAllCities]);

  useEffect(() => {
    if (!includeAllCities) return;

    let cancelled = false;
    setAllLoading(true);

    void fetch("/api/admin/cities")
      .then(async (res) => {
        if (cancelled) return;
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data)) {
          setAllCities((data as AdminCityRow[]).map((city) => city.name));
        }
      })
      .catch(() => {
        /* keep previous */
      })
      .finally(() => {
        if (!cancelled) setAllLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [includeAllCities]);

  if (includeAllCities) {
    return { cities: allCities, loading: allLoading, refresh: refreshAllCities };
  }

  return {
    cities: publicCities,
    loading: publicLoading,
    refresh: async () => undefined,
  };
}
