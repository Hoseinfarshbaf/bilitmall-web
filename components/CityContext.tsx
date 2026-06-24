"use client";

import { createContext, useContext, useMemo, useState } from "react";

type CityContextType = {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
};

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [selectedCity, setSelectedCity] = useState("تهران");

  const value = useMemo(
    () => ({
      selectedCity,
      setSelectedCity,
    }),
    [selectedCity],
  );

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity() {
  const context = useContext(CityContext);

  if (!context) {
    throw new Error("useCity must be used within a CityProvider");
  }

  return context;
}
