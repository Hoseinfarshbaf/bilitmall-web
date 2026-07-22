"use client";

import { useMemo, useState } from "react";
import { ChevronRight, LayoutGrid, MapPin, Search } from "lucide-react";
import { filterCitiesBySearch } from "@/lib/cities/search";

type CityPickerPanelProps = {
  cities: string[];
  topCities: string[];
  selectedCity: string;
  onSelect: (city: string) => void;
  variant?: "navbar" | "discovery";
};

const panelShellClass =
  "overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/95 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl animate-in fade-in zoom-in duration-150 dark:border-neutral-700/80 dark:bg-neutral-900/95 dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)]";

export default function CityPickerPanel({
  cities,
  topCities,
  selectedCity,
  onSelect,
  variant = "navbar",
}: CityPickerPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllCities, setShowAllCities] = useState(false);

  const filteredCities = useMemo(
    () => filterCitiesBySearch(cities, searchQuery),
    [cities, searchQuery]
  );

  const isSearching = searchQuery.trim().length > 0;
  const hasMoreCities = cities.length > topCities.length;
  const accent = variant === "discovery";

  function handleSelect(city: string) {
    onSelect(city);
    setSearchQuery("");
    setShowAllCities(false);
  }

  function cityChipClass(isSelected: boolean) {
    if (isSelected) {
      return accent
        ? "border-brand-500 bg-brand-500 text-white shadow-sm shadow-brand-100 dark:shadow-brand-900/30"
        : "border-brand-300 bg-brand-50 text-brand-600 dark:border-red-500/40 dark:bg-brand-500/15 dark:text-brand-400";
    }
    return accent
      ? "border-neutral-200/80 bg-white/80 text-neutral-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-200 dark:hover:border-brand-500/40 dark:hover:bg-brand-400/10 dark:hover:text-brand-400"
      : "border-neutral-200/60 bg-white/70 text-neutral-700 hover:border-brand-200 hover:bg-brand-50/80 hover:text-brand-600 dark:border-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-200 dark:hover:border-brand-500/30 dark:hover:bg-brand-400/10 dark:hover:text-brand-400";
  }

  function listItemClass(isSelected: boolean) {
    if (isSelected) {
      return accent
        ? "bg-brand-500 font-bold text-white"
        : "bg-brand-50 font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400";
    }
    return accent
      ? "font-bold text-neutral-600 hover:bg-brand-50 hover:text-brand-600 dark:text-neutral-300 dark:hover:bg-brand-400/10 dark:hover:text-brand-400"
      : "text-neutral-700 hover:bg-black/5 hover:text-brand-600 dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-brand-400";
  }

  return (
    <div className={`${panelShellClass} w-64`}>
      <div className="flex items-center gap-2 border-b border-neutral-200/50 bg-white/90 px-3 py-2 dark:border-neutral-700/60 dark:bg-neutral-900/90">
        {showAllCities && !isSearching ? (
          <button
            type="button"
            onClick={() => setShowAllCities(false)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label="بازگشت به شهرهای پربازدید"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <Search className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" />
        )}
        <input
          type="text"
          placeholder={showAllCities && !isSearching ? "جستجو در همه شهرها..." : "جستجوی شهر..."}
          className="w-full bg-transparent text-right text-sm text-neutral-700 outline-none placeholder:text-neutral-400 dark:text-neutral-200 dark:placeholder:text-neutral-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div
        className={`p-1.5 scrollbar-hide ${
          showAllCities || isSearching ? "max-h-[min(70vh,18rem)] overflow-y-auto" : ""
        }`}
      >
        {isSearching ? (
          filteredCities.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5">
              {filteredCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleSelect(city)}
                  className={`rounded-xl border px-2 py-2 text-center text-xs font-bold transition ${cityChipClass(city === selectedCity)}`}
                >
                  {city}
                </button>
              ))}
            </div>
          ) : (
            <p className="px-2 py-6 text-center text-sm text-gray-500">شهری یافت نشد</p>
          )
        ) : showAllCities ? (
          <>
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-[10px] font-bold text-gray-500">همه شهرها</p>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                {cities.length.toLocaleString("fa-IR")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {cities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleSelect(city)}
                  className={`rounded-xl border px-2 py-2 text-center text-xs font-bold transition ${cityChipClass(city === selectedCity)}`}
                >
                  {city}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {topCities.length > 0 ? (
              <p className="px-1.5 py-1 text-[10px] font-bold text-gray-500">شهرهای پربازدید</p>
            ) : null}
            <div className="space-y-0.5">
              {topCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleSelect(city)}
                  className={`flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-right text-sm transition ${listItemClass(city === selectedCity)}`}
                >
                  <MapPin className="h-3 w-3 shrink-0 opacity-60" />
                  <span>{city}</span>
                </button>
              ))}
            </div>

            {hasMoreCities ? (
              <button
                type="button"
                onClick={() => setShowAllCities(true)}
                className={`mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed px-2 py-1.5 text-xs font-bold transition ${
                  accent
                    ? "border-brand-200 bg-brand-50/50 text-brand-600 hover:border-brand-300 hover:bg-brand-50"
                    : "border-gray-300/80 bg-white/60 text-gray-700 hover:border-brand-200 hover:bg-brand-50/60 hover:text-brand-600"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                همه شهرها
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
