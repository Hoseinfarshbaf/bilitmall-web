"use client";

import { useEffect } from "react";
import { useCity } from "@/components/CityContext";
import { useCities } from "@/components/CitiesProvider";

/** اگر شهر انتخاب‌شده رویداد فعال ندارد، اولین شهر دارای رویداد را انتخاب می‌کند. */
export default function CitySelectionSync() {
  const { cities, loading } = useCities();
  const { selectedCity, setSelectedCity } = useCity();

  useEffect(() => {
    if (loading || cities.length === 0) return;
    if (!cities.includes(selectedCity)) {
      setSelectedCity(cities[0]);
    }
  }, [cities, loading, selectedCity, setSelectedCity]);

  return null;
}
