"use client";

import { useEffect, useState } from "react";
import { useCities } from "@/components/CitiesProvider";

type AdminCityRow = { name: string };

export function useCityOptions(includeAllCities = false) {
  const { cities: publicCities, loading: publicLoading } = useCities();
  const [allCities, setAllCities] = useState<string[]>([]);
  const [allLoading, setAllLoading] = useState(false);

  useEffect(() => {
    if (!includeAllCities) return;

    let cancelled = false;
    setAllLoading(true);

    void (async () => {
      try {
        const res = await fetch("/api/admin/cities");
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data)) {
          setAllCities((data as AdminCityRow[]).map((city) => city.name));
        }
      } catch {
        /* keep previous */
      } finally {
        if (!cancelled) setAllLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [includeAllCities]);

  if (includeAllCities) {
    return { cities: allCities, loading: allLoading };
  }

  return { cities: publicCities, loading: publicLoading };
}
