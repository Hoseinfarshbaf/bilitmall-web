"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { events } from "@/data/events";
import EventCard from "@/components/EventCard";
import { Search, MapPin, ChevronDown, Home } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { id: "all", label: "همه", value: "همه" },
  { id: "concert", label: "کنسرت", value: "کنسرت" },
  { id: "theater", label: "تئاتر", value: "تئاتر" },
  { id: "sport", label: "ورزشی", value: "ورزشی" },
];

const ALL_CITIES = ["تهران", "اصفهان", "شیراز", "تبریز", "مشهد", "کیش", "کرج", "اهواز", "رشت", "کرمان"];

export default function DiscoveryPage() {
  const params = useParams();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const cityParam = decodeURIComponent(params.city as string);
  const categoryParam = decodeURIComponent(params.category as string);

  const [searchQuery, setSearchQuery] = useState("");
  const [isCityOpen, setIsCityOpen] = useState(false);

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
    return events.filter((event) => {
      const matchCity = event.city === cityParam;
      const matchCategory = categoryParam === "همه" || event.category.includes(categoryParam);
      const matchSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCity && matchCategory && matchSearch;
    });
  }, [cityParam, categoryParam, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans" dir="rtl">
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Link 
                href="/" 
                className="flex items-center gap-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 px-4 py-2 rounded-2xl transition-all font-bold text-sm border border-transparent hover:border-red-100"
              >
                <Home className="w-4 h-4" />
                صفحه اصلی
              </Link>

              <div className="h-10 w-px bg-gray-200 hidden md:block"></div>

              <div>
                <h1 className="text-2xl font-black text-neutral-900 leading-none">
                  {categoryParam === "همه" ? "همه رویدادها" : categoryParam}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-lg text-xs font-black border border-red-100">
                    <MapPin className="w-3 h-3" />
                    {cityParam}
                  </span>
                  <span className="text-gray-400 text-xs font-bold">•</span>
                  <span className="text-gray-600 text-xs font-bold bg-gray-100 px-2 py-0.5 rounded-lg">
                    {filteredEvents.length} رویداد فعال
                  </span>
                </div>
              </div>
            </div>

            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsCityOpen(!isCityOpen)}
                className="w-full md:w-auto flex items-center justify-between gap-3 bg-white border-2 border-gray-100 hover:border-red-600 px-5 py-2.5 rounded-2xl transition-all shadow-sm"
              >
                <div className="flex items-center gap-2 text-gray-700 font-bold">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span className="text-sm">تغییر شهر: {cityParam}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCityOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCityOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 z-[60]">
                  <div className="grid grid-cols-1 gap-1">
                    {ALL_CITIES.map(city => (
                      <button
                        key={city}
                        onClick={() => {
                          router.push(`/events/${city}/${categoryParam}`);
                          setIsCityOpen(false);
                        }}
                        className={`text-right px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          city === cityParam 
                          ? "bg-red-600 text-white" 
                          : "text-gray-600 hover:bg-red-50 hover:text-red-600"
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row items-center gap-4 bg-gray-50 p-3 rounded-[2rem] border border-gray-100">
            <div className="relative w-full md:w-80">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="نام رویداد یا هنرمند..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-transparent rounded-2xl py-3 pr-11 pl-4 focus:ring-2 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all text-sm font-bold shadow-sm"
              />
            </div>

            <div className="hidden md:block w-px h-8 bg-gray-200 mx-1"></div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide w-full">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => router.push(`/events/${cityParam}/${cat.value}`)}
                  className={`px-6 py-2.5 rounded-2xl text-sm font-black transition-all shrink-0 ${
                    categoryParam === cat.value
                      ? "bg-red-600 text-white shadow-lg shadow-red-100 scale-105"
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

      <div className="max-w-6xl mx-auto px-4 mt-12">
        {filteredEvents.length > 0 ? (
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
            <p className="text-gray-900 font-black text-xl">چیزی پیدا نکردیم!</p>
            <p className="text-gray-400 text-sm mt-2 font-bold">شاید با فیلتر یا شهر دیگه‌ای شانس بیشتری داشته باشی.</p>
            <button 
              onClick={() => {setSearchQuery(""); router.push(`/events/${cityParam}/همه`)}}
              className="mt-6 text-red-600 font-bold border-b-2 border-red-600 hover:text-red-800 transition-colors"
            >
              مشاهده تمام رویدادهای {cityParam}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}