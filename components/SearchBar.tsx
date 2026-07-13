"use client";

import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Search, X, CalendarDays, MapPin, CornerDownLeft } from "lucide-react";
import { useCity } from "@/components/CityContext";
import { useEvents } from "@/hooks/useEvents";
import EventFramedImage from "@/components/EventFramedImage";
import {
  buildDiscoveryPageUrl,
  getCityEventsFromList,
  getEventUrl,
} from "@/lib/events/helpers";
import { formatEventDateDisplay } from "@/lib/events/date-utils";
import type { EventItem } from "@/lib/events/types";

const MAX_SUGGESTIONS = 6;

/** یکسان‌سازی حروف فارسی/عربی و حذف نیم‌فاصله برای تطبیق بهتر */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[يی]/g, "ی")
    .replace(/[كک]/g, "ک")
    .replace(/[أإآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[\u200c\u200f\u200e]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** آیا همه کاراکترهای query به ترتیب در متن ظاهر می‌شوند (تطبیق تقریبی) */
function isSubsequence(query: string, text: string): boolean {
  let i = 0;
  for (let j = 0; j < text.length && i < query.length; j++) {
    if (query[i] === text[j]) i++;
  }
  return i === query.length;
}

/** امتیازدهی به میزان شباهت — عدد کمتر یعنی مرتبط‌تر */
function scoreMatch(query: string, title: string): number | null {
  const q = normalize(query);
  const t = normalize(title);
  if (!q) return null;

  if (t === q) return 0;
  if (t.startsWith(q)) return 1;

  const wordStart = t.split(" ").some((word) => word.startsWith(q));
  if (wordStart) return 2;

  if (t.includes(q)) return 3;

  if (q.length >= 2 && isSubsequence(q, t)) return 4;

  return null;
}

export default function SearchBar() {
  const { selectedCity } = useCity();
  const router = useRouter();
  const { events } = useEvents();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const cityEvents = useMemo(
    () => getCityEventsFromList(events, selectedCity),
    [events, selectedCity]
  );

  const suggestions = useMemo(() => {
    const q = query.trim();
    if (!q) return [] as EventItem[];

    return cityEvents
      .map((event) => ({ event, score: scoreMatch(q, event.title) }))
      .filter(
        (item): item is { event: EventItem; score: number } =>
          item.score !== null
      )
      .sort((a, b) => a.score - b.score)
      .slice(0, MAX_SUGGESTIONS)
      .map((item) => item.event);
  }, [cityEvents, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToSearchPage(term: string) {
    const base = buildDiscoveryPageUrl(selectedCity, "همه");
    const q = term.trim();
    setIsOpen(false);
    router.push(q ? `${base}?q=${encodeURIComponent(q)}` : base);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      router.push(getEventUrl(suggestions[activeIndex]));
      setIsOpen(false);
      return;
    }
    goToSearchPage(query);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1
      );
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-red-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={`جستجوی رویداد در ${selectedCity}...`}
            aria-label="جستجوی رویداد"
            autoComplete="off"
            className={`w-full border border-neutral-200 bg-white py-4 pr-12 pl-11 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-red-500 dark:focus:ring-red-500/20 ${
              showDropdown && suggestions.length > 0
                ? "rounded-t-3xl rounded-b-none border-b-transparent"
                : "rounded-full"
            }`}
          />
          {query ? (
            <button
              type="button"
              aria-label="پاک کردن"
              onClick={() => {
                setQuery("");
                setActiveIndex(-1);
                setIsOpen(false);
              }}
              className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </form>

      {showDropdown ? (
        <div className="absolute z-50 w-full overflow-hidden rounded-b-3xl border border-t-0 border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          {suggestions.length > 0 ? (
            <ul className="max-h-88 overflow-y-auto py-1">
              {suggestions.map((event, index) => (
                <li key={event.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      router.push(getEventUrl(event));
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-right transition ${
                      index === activeIndex
                        ? "bg-red-50 dark:bg-red-500/10"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                      <EventFramedImage image={event.image} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-neutral-800 dark:text-neutral-100">
                        {event.title}
                      </span>
                      <span className="mt-1 flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatEventDateDisplay(event)}
                        </span>
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{event.place}</span>
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                      {event.category}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
              رویدادی با این نام در {selectedCity} پیدا نشد.
            </div>
          )}

          <button
            type="button"
            onClick={() => goToSearchPage(query)}
            className="flex w-full items-center justify-between gap-2 border-t border-neutral-100 bg-neutral-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <span className="inline-flex items-center gap-2">
              <Search className="h-4 w-4" />
              مشاهده همه نتایج «{query.trim()}»
            </span>
            <CornerDownLeft className="h-4 w-4 text-neutral-400" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
