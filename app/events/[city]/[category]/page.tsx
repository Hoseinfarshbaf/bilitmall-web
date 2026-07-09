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
  const [isCityOpen, setIsCityOpen] = useState(false);

  useEffect(() => {
    setSelectedCity(cityParam);
  }, [cityParam, setSelectedCity]);

  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

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
    <div className="min-h-screen bg-gray-50 pb-20 font-sans" dir="rtl">
      <div className="bg-white/90 border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              title="بازگشت به صفحه اصلی"
              className="flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">صفحه اصلی</span>
            </Link>

            <div className="min-w-0 flex items-center gap-2">
              <h1 className="text-lg font-black text-neutral-900 leading-none truncate">
                {pageTitle}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {filteredEvents.length} رویداد فعال
              </span>
            </div>

            <div className="relative mr-auto shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setIsCityOpen((open) => !open)}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 transition-all hover:border-red-600 hover:text-red-600"
              >
                <MapPin className="w-4 h-4 text-red-600" />
                <span>{cityParam}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCityOpen ? 'rotate-180' : ''}`} />
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
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="نام رویداد یا هنرمند..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-red-600/10 focus:border-red-600 focus:bg-white outline-none transition-all text-sm font-bold"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => router.push(buildDiscoveryPageUrl(cityParam, cat.value))}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${
                    categoryParam.trim() === cat.value.trim()
                      ? "bg-red-600 text-white shadow-sm shadow-red-100"
                      : "bg-white border border-gray-200 text-gray-500 hover:border-red-600 hover:text-red-600"
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
          <p className="py-20 text-center font-bold text-gray-500">در حال بارگذاری رویدادها...</p>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <div key={event.id} className="flex justify-center transform transition-hover hover:-translate-y-1 duration-300">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="bg-red-50 p-8 rounded-full mb-6">
              <Search className="w-12 h-12 text-red-300" />
            </div>
            {searchQuery.trim() ? (
              <>
                <p className="text-gray-900 font-black text-xl">نتیجه‌ای برای «{searchQuery}» در {cityParam} یافت نشد</p>
                <p className="text-gray-400 text-sm mt-2 font-bold">عبارت جستجو را تغییر دهید یا دسته دیگری را امتحان کنید.</p>
              </>
            ) : (
              <>
                <p className="text-gray-900 font-black text-xl">رویدادی برای شهر {cityParam} موجود نیست</p>
                <p className="text-gray-400 text-sm mt-2 font-bold">شهر دیگری انتخاب کنید یا بعداً دوباره سر بزنید.</p>
              </>
            )}
            {searchQuery.trim() ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  router.push(buildDiscoveryPageUrl(cityParam, "همه"));
                }}
                className="mt-6 text-red-600 font-bold border-b-2 border-red-600 hover:text-red-800 transition-colors"
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