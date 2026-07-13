"use client";

import { useEffect, useRef, useState } from "react";

type VenueSuggestion = {
  id: number;
  name: string;
  slug: string;
  city: string;
  address: string;
};

type VenuePlaceAutocompleteProps = {
  city: string;
  value: string;
  venueTemplateId: number | null;
  placeAddress: string;
  onChange: (place: string, venueTemplateId: number | null, placeAddress: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  variant?: "my-event" | "admin";
  showLinkedAddress?: boolean;
  searchPath?: string;
};

const themes = {
  "my-event": {
    warning: "text-amber-600 dark:text-amber-400",
    selected: "text-emerald-600 dark:text-emerald-400",
    hint: "text-neutral-400 dark:text-slate-500",
    address: "text-neutral-500 dark:text-slate-400",
    list: "border-neutral-200 bg-white shadow-lg dark:border-white/10 dark:bg-slate-900",
    item: "text-neutral-800 hover:bg-neutral-100 dark:text-white dark:hover:bg-white/10",
    itemActive: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    loading: "text-neutral-400 dark:text-slate-500",
  },
  admin: {
    warning: "text-amber-600 dark:text-amber-400",
    selected: "text-blue-600 dark:text-blue-400",
    hint: "text-slate-500 dark:text-slate-400",
    address: "text-slate-500 dark:text-slate-400",
    list: "border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800",
    item: "text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700",
    itemActive: "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    loading: "text-slate-400 dark:text-slate-500",
  },
};

export default function VenuePlaceAutocomplete({
  city,
  value,
  venueTemplateId,
  placeAddress,
  onChange,
  placeholder = "محل برگزاری",
  className = "",
  required,
  variant = "my-event",
  showLinkedAddress = true,
  searchPath,
}: VenuePlaceAutocompleteProps) {
  const theme = themes[variant];
  const apiPath = searchPath ?? (variant === "admin" ? "/api/admin/venues" : "/api/my-event/venues");

  const [suggestions, setSuggestions] = useState<VenueSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const cityName = city.trim();
    if (!cityName) {
      const clearTimer = setTimeout(() => setSuggestions([]), 0);
      return () => clearTimeout(clearTimer);
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ city: cityName, q: value.trim() });
        const res = await fetch(`${apiPath}?${params.toString()}`);
        if (res.ok) {
          const data = (await res.json()) as VenueSuggestion[];
          setSuggestions(data);
        }
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [value, city, apiPath]);

  function handleInputChange(next: string) {
    const matched = suggestions.find((s) => s.name === next);
    onChange(next, matched?.id ?? null, matched?.address ?? "");
    setOpen(true);
  }

  function selectVenue(venue: VenueSuggestion) {
    onChange(venue.name, venue.id, venue.address);
    setOpen(false);
  }

  const citySelected = Boolean(city.trim());
  const showList = open && citySelected && suggestions.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        required={required}
        value={value}
        placeholder={citySelected ? placeholder : "ابتدا شهر را انتخاب کنید"}
        disabled={!citySelected}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (citySelected) setOpen(true);
        }}
        className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
        autoComplete="off"
      />
      {!citySelected ? (
        <p className={`mt-1 text-xs ${theme.warning}`}>
          برای جستجوی سالن، ابتدا شهر رویداد را انتخاب کنید.
        </p>
      ) : venueTemplateId ? (
        <div className="mt-1 space-y-1">
          <p className={`text-xs ${theme.selected}`}>
            سالن ثبت‌شده انتخاب شد — نقشه صندلی همان سالن برای رویداد لحاظ می‌شود.
          </p>
          {showLinkedAddress && placeAddress ? (
            <p className={`text-xs ${theme.address}`}>آدرس اجرا: {placeAddress}</p>
          ) : null}
        </div>
      ) : (
        <p className={`mt-1 text-xs ${theme.hint}`}>
          نام سالن را تایپ کنید (مثلاً «میلاد») — فقط سالن‌های شهر {city} پیشنهاد می‌شود.
        </p>
      )}
      {showList ? (
        <ul
          className={`absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border py-1 ${theme.list}`}
        >
          {suggestions.map((venue) => (
            <li key={venue.id}>
              <button
                type="button"
                onClick={() => selectVenue(venue)}
                className={`w-full px-4 py-2.5 text-right text-sm ${theme.item} ${
                  venueTemplateId === venue.id ? theme.itemActive : ""
                }`}
              >
                <span className="block font-bold">{venue.name}</span>
                {venue.address ? (
                  <span className={`mt-0.5 block text-xs ${theme.address}`}>{venue.address}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {loading ? (
        <p className={`absolute left-3 top-3 text-xs ${theme.loading}`}>...</p>
      ) : null}
    </div>
  );
}
