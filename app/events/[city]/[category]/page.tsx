"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  buildDiscoveryPageUrl,
  getCityEventsFromList,
  getPopularEventsFromList,
  matchesEventCategory,
  POPULAR_CATEGORY_SLUG,
} from "@/lib/events/helpers";
import { useEvents } from "@/hooks/useEvents";
import { useCities } from "@/components/CitiesProvider";
import { useCity } from "@/components/CityContext";
import EventCard from "@/components/EventCard";
import CityPickerPanel from "@/components/CityPickerPanel";
import ThemeToggle from "@/components/ThemeToggle";
import { MapPin, ChevronDown, Home, Search } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { id: "all", label: "همه", value: "همه" },
  { id: "concert", label: "کنسرت", value: "کنسرت" },
  { id: "theater", label: "تئاتر", value: "تئاتر" },
  { id: "event", label: "ایونت", value: "ایونت" },
];

export default function DiscoveryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { events, loading } = useEvents();
  const { cities, topCities } = useCities();
  const { setSelectedCity } = useCity();
  
  const cityParam = decodeURIComponent(params.city as string);
  const categoryParam = decodeURIComponent(params.category as string);
  const initialQuery = searchParams.get("q") ?? "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [trackedInitialQuery, setTrackedInitialQuery] = useState(initialQuery);
  if (initialQuery !== trackedInitialQuery) {
    setTrackedInitialQuery(initialQuery);
    setSearchQuery(initialQuery);
  }
  const [isCityOpen, setIsCityOpen] = useState(false);

  useEffect(() => {
    setSelectedCity(cityParam);
  }, [cityParam, setSelectedCity]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCityOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEvents = useMemo(() => {
    const baseEvents =
      categoryParam.trim() === POPULAR_CATEGORY_SLUG
        ? getPopularEventsFromList(events, cityParam)
        : getCityEventsFromList(events, cityParam);

    return baseEvents.filter((event) => {
      const matchCategory =
        categoryParam.trim() === POPULAR_CATEGORY_SLUG ||
        matchesEventCategory(event.category, categoryParam);
      const matchSearch = event.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [events, cityParam, categoryParam, searchQuery]);

  const pageTitle =
    categoryParam.trim() === POPULAR_CATEGORY_SLUG
      ? "رویدادهای محبوب"
      : categoryParam === "همه"
        ? "همه رویدادها"
        : categoryParam;

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 font-sans dark:bg-neutral-950" dir="rtl">
      <div className="sticky top-0 z-50 border-b border-neutral-100 bg-white/90 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              title="بازگشت به صفحه اصلی"
              className="flex shrink-0 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-bold text-neutral-600 transition-all hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-brand-500/40 dark:hover:bg-brand-400/10 dark:hover:text-brand-400"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">صفحه اصلی</span>
            </Link>

            <div className="min-w-0 flex items-center gap-2">
              <h1 className="truncate text-lg font-black leading-none text-neutral-900 dark:text-neutral-100">
                {pageTitle}
              </h1>
              <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 sm:inline-flex dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
                </span>
                {filteredEvents.length} رویداد فعال
              </span>
            </div>

            <div className="relative mr-auto flex shrink-0 items-center gap-2" ref={dropdownRef}>
              <ThemeToggle size="sm" showLabel={false} />
              <button
                onClick={() => setIsCityOpen((open) => !open)}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-bold text-neutral-700 transition-all hover:border-red-600 hover:text-brand-600 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-brand-500 dark:hover:text-brand-400"
              >
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>{cityParam}</span>
                <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform dark:text-neutral-500 ${isCityOpen ? "rotate-180" : ""}`} />
              </button>

              {isCityOpen ? (
                <div className="absolute left-0 z-60 mt-2">
                  <CityPickerPanel
                    variant="discovery"
                    cities={cities}
                    topCities={topCities}
                    selectedCity={cityParam}
                    onSelect={(city) => {
                      router.push(buildDiscoveryPageUrl(city, categoryParam));
                      setIsCityOpen(false);
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
              <input
                type="text"
                placeholder="نام رویداد یا هنرمند..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-neutral-100 bg-neutral-50 py-2.5 pr-10 pl-4 text-sm font-bold outline-none transition-all focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-brand-600/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-brand-500 dark:focus:bg-neutral-900 dark:focus:ring-brand-500/20"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => router.push(buildDiscoveryPageUrl(cityParam, cat.value))}
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                    categoryParam.trim() === cat.value.trim()
                      ? "bg-brand-500 text-white shadow-sm shadow-brand-100 dark:shadow-brand-900/30"
                      : "border border-neutral-200 bg-white text-neutral-500 hover:border-red-600 hover:text-brand-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-brand-500 dark:hover:text-brand-400"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        {loading ? (
          <p className="py-20 text-center font-bold text-neutral-500 dark:text-neutral-400">در حال بارگذاری رویدادها...</p>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <div key={event.id} className="flex justify-center transform transition-hover hover:-translate-y-1 duration-300">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-neutral-100 bg-white py-40 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-6 rounded-full bg-brand-50 p-8 dark:bg-brand-500/10">
              <Search className="h-12 w-12 text-brand-300 dark:text-brand-400" />
            </div>
            {searchQuery.trim() ? (
              <>
                <p className="text-xl font-black text-neutral-900 dark:text-neutral-100">نتیجه‌ای برای «{searchQuery}» در {cityParam} یافت نشد</p>
                <p className="mt-2 text-sm font-bold text-neutral-400 dark:text-neutral-500">عبارت جستجو را تغییر دهید یا دسته دیگری را امتحان کنید.</p>
              </>
            ) : (
              <>
                <p className="text-xl font-black text-neutral-900 dark:text-neutral-100">رویدادی برای شهر {cityParam} موجود نیست</p>
                <p className="mt-2 text-sm font-bold text-neutral-400 dark:text-neutral-500">شهر دیگری انتخاب کنید یا بعداً دوباره سر بزنید.</p>
              </>
            )}
            {searchQuery.trim() ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  router.push(buildDiscoveryPageUrl(cityParam, "همه"));
                }}
                className="mt-6 border-b-2 border-red-600 font-bold text-brand-600 transition-colors hover:text-red-800 dark:text-brand-400 dark:hover:text-brand-300"
              >
                مشاهده همه رویدادهای {cityParam}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}