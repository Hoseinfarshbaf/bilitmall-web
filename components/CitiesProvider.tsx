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
import { DEFAULT_CITY_NAMES } from "@/lib/cities/constants";

type CitiesContextType = {
  cities: string[];
  cityRows: CityRecord[];
  popularCities: string[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const CitiesContext = createContext<CitiesContextType | undefined>(undefined);

export function CitiesProvider({ children }: { children: React.ReactNode }) {
  const [cityRows, setCityRows] = useState<CityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
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
    void refresh();
  }, [refresh]);

  const value = useMemo<CitiesContextType>(() => {
    const names =
      cityRows.length > 0 ? cityRows.map((c) => c.name) : [...DEFAULT_CITY_NAMES];
    const popular =
      cityRows.length > 0
        ? cityRows.filter((c) => c.isPopular).map((c) => c.name)
        : DEFAULT_CITY_NAMES.slice(0, 5);

    return {
      cities: names,
      cityRows,
      popularCities: popular.length > 0 ? popular : names.slice(0, 5),
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
