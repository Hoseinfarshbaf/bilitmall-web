"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CityRecord } from "@/lib/cities/types";
import { TOP_CITIES_IN_SELECTOR } from "@/lib/cities/constants";

type CitiesContextType = {
  cities: string[];
  cityRows: CityRecord[];
  /** حداکثر ۵ شهر با بیشترین رویداد فعال — برای نمایش پیش‌فرض در انتخاب شهر */
  topCities: string[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const CitiesContext = createContext<CitiesContextType | undefined>(undefined);

export function CitiesProvider({ children }: { children: React.ReactNode }) {
  const [cityRows, setCityRows] = useState<CityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cities");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCityRows(data as CityRecord[]);
      }
    } catch {
      /* keep fallback */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/cities")
      .then(async (res) => {
        if (cancelled) return;
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data)) {
          setCityRows(data as CityRecord[]);
        }
      })
      .catch(() => {
        /* keep fallback */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<CitiesContextType>(() => {
    const activeCityRows = cityRows.filter((c) => (c.eventCount ?? 0) > 0);
    const names = activeCityRows.map((c) => c.name);

    const byEvents = (a: CityRecord, b: CityRecord) =>
      (b.eventCount ?? 0) - (a.eventCount ?? 0) ||
      a.sortOrder - b.sortOrder ||
      a.name.localeCompare(b.name, "fa");

    const topCities = [...activeCityRows]
      .sort(byEvents)
      .slice(0, TOP_CITIES_IN_SELECTOR)
      .map((c) => c.name);

    return {
      cities: names,
      cityRows,
      topCities,
      loading,
      refresh,
    };
  }, [cityRows, loading, refresh]);

  return <CitiesContext.Provider value={value}>{children}</CitiesContext.Provider>;
}

export function useCities() {
  const context = useContext(CitiesContext);
  if (!context) {
    throw new Error("useCities must be used within a CitiesProvider");
  }
  return context;
}
