"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type VenueSuggestion = {
  id: number;
  name: string;
  city: string;
  address: string;
};

type VenueSearchAutocompleteProps = {
  value: string;
  city: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

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

function rankSuggestions(items: VenueSuggestion[], query: string): VenueSuggestion[] {
  const q = normalize(query);
  if (!q) return items;

  const starts: VenueSuggestion[] = [];
  const contains: VenueSuggestion[] = [];
  const seen = new Set<number>();

  for (const item of items) {
    const name = normalize(item.name);
    if (name.startsWith(q)) {
      starts.push(item);
      seen.add(item.id);
    }
  }
  for (const item of items) {
    if (seen.has(item.id)) continue;
    const name = normalize(item.name);
    const address = normalize(item.address ?? "");
    if (name.includes(q) || address.includes(q)) {
      contains.push(item);
    }
  }

  return [...starts, ...contains];
}

export default function VenueSearchAutocomplete({
  value,
  city,
  onChange,
  placeholder = "نام سالن، آدرس، رویداد...",
}: VenueSearchAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<VenueSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          if (value.trim()) params.set("q", value.trim());
          if (city && city !== "همه") params.set("city", city);
          const res = await fetch(`/api/admin/venues?${params.toString()}`, {
            signal: controller.signal,
          });
          const data = (await res.json()) as VenueSuggestion[] | { error?: string };
          if (requestId !== requestIdRef.current) return;
          if (!res.ok || !Array.isArray(data)) {
            setSuggestions([]);
            return;
          }
          setSuggestions(rankSuggestions(data, value));
          setActiveIndex(0);
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          if (requestId === requestIdRef.current) setSuggestions([]);
        } finally {
          if (requestId === requestIdRef.current) setLoading(false);
        }
      })();
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, city]);

  const ranked = useMemo(() => rankSuggestions(suggestions, value), [suggestions, value]);

  const isExactMatch =
    ranked.length === 1 && normalize(ranked[0].name) === normalize(value);
  const showList = open && ranked.length > 0 && !isExactMatch;

  function selectVenue(venue: VenueSuggestion) {
    onChange(venue.name);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || ranked.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, ranked.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && ranked[activeIndex]) {
      e.preventDefault();
      selectVenue(ranked[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative min-w-0 w-full", open && "z-30")}>
      <Search className="pointer-events-none absolute right-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
          value ? "pl-9" : "pl-4"
        )}
        autoComplete="off"
      />
      {value ? (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange("");
            setOpen(true);
          }}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          aria-label="پاک کردن"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      {showList ? (
        <ul className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {ranked.map((venue, index) => (
            <li key={venue.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectVenue(venue)}
                className={cn(
                  "flex w-full items-start gap-2 px-4 py-2.5 text-right text-sm transition-colors",
                  index === activeIndex
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                    : "text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                )}
              >
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span className="min-w-0">
                  <span className="block font-bold">{venue.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                    {venue.city}
                    {venue.address ? ` · ${venue.address}` : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open && !loading && value.trim() && ranked.length === 0 ? (
        <div className="absolute top-full z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          سالنی با این نام یافت نشد.
        </div>
      ) : null}
    </div>
  );
}
