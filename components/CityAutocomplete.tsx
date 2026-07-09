"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { useCityOptions } from "@/hooks/useCityOptions";

type CityAutocompleteProps = {
  value: string;
  onChange: (city: string) => void;
  id?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  /** در پنل ادمین همه شهرهای ثبت‌شده نمایش داده می‌شود، نه فقط شهرهای دارای رویداد */
  includeAllCities?: boolean;
};

/** نرمال‌سازی حروف فارسی/عربی برای جستجوی روان */
function normalize(text: string): string {
  return text
    .replace(/\u200c/g, " ")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .trim()
    .toLowerCase();
}

const baseInputClass =
  "w-full rounded-xl border border-slate-200 bg-white py-3 pr-10 pl-9 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export default function CityAutocomplete({
  value,
  onChange,
  id,
  required,
  placeholder = "جستجوی شهر...",
  className = baseInputClass,
  includeAllCities = false,
}: CityAutocompleteProps) {
  const { cities, loading } = useCityOptions(includeAllCities);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q) return cities;

    const starts: string[] = [];
    const contains: string[] = [];
    for (const city of cities) {
      const nc = normalize(city);
      if (nc.startsWith(q)) starts.push(city);
      else if (nc.includes(q)) contains.push(city);
    }
    return [...starts, ...contains];
  }, [cities, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function selectCity(city: string) {
    onChange(city);
    setQuery(city);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (suggestions[activeIndex]) {
        e.preventDefault();
        selectCity(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const isExactMatch = suggestions.length === 1 && normalize(suggestions[0]) === normalize(query);
  const showList = open && suggestions.length > 0 && !isExactMatch;

  return (
    <div ref={containerRef} className="relative">
      <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        id={id}
        type="text"
        required={required}
        value={query}
        placeholder={placeholder}
        disabled={loading}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={`${className} disabled:opacity-60`}
        autoComplete="off"
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            onChange("");
            setOpen(true);
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label="پاک کردن"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      {showList ? (
        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {suggestions.map((city, index) => (
            <li key={city}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectCity(city)}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-right text-sm transition-colors ${
                  index === activeIndex
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                    : "text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                } ${city === value ? "font-black" : "font-medium"}`}
              >
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                <span>{city}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open && !loading && suggestions.length === 0 ? (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          شهری با این نام یافت نشد.
        </div>
      ) : null}
    </div>
  );
}
