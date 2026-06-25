//  نوبار
"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useCity } from "@/components/CityContext";
import { ChevronDown, Ticket, User, MapPin, Search } from "lucide-react";

const allCities = [
  "تهران", "اصفهان", "شیراز", "تبریز", "مشهد", "کیش", "کرج", "اهواز", "رشت", "کرمان",
];
const popularCities = ["تهران", "اصفهان", "شیراز", "مشهد", "تبریز"];

export default function Navbar() {
  const { selectedCity, setSelectedCity } = useCity();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const filteredCities = allCities.filter((city) => city.includes(searchQuery));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-xl font-black text-red-600">
            <Ticket className="h-8 w-8" />
            <span>بلیت‌مال</span>
          </Link>

          <nav className="hidden gap-6 md:flex">
            {/* لینک‌های داینامیک با در نظر گرفتن شهر انتخاب شده */}
            <Link
              href={`/events/${selectedCity}/کنسرت`}
              className="text-sm font-bold text-gray-600 transition hover:text-red-600"
            >
              کنسرت
            </Link>
            <Link
              href={`/events/${selectedCity}/تئاتر`}
              className="text-sm font-bold text-gray-600 transition hover:text-red-600"
            >
              تئاتر
            </Link>
            <Link
              href={`/events/${selectedCity}/ورزش و تفریح`}
              className="text-sm font-bold text-gray-600 transition hover:text-red-600"
            >
              ورزشی | تفریحی
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <MapPin className="h-4 w-4 text-red-600" />
              <span>{selectedCity}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* دراپ‌داون شیشه‌ای - اصلاح موقعیت به سمت راست برای تراز شدن */}
            {isOpen && (
               <div className="absolute right-[-40] z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/20 bg-white/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in duration-150">
                {/* فیلد جستجو */}
                <div className="flex items-center gap-2 border-b border-gray-200/50 px-4 py-3 bg-white/90">
                  <Search className="h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="جستجوی شهر..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-700 text-right"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-60 overflow-y-auto p-1 scrollbar-hide">
                  {!searchQuery && (
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-900 uppercase text-right">
                      شهرهای پربازدید
                    </div>
                  )}
                  {(searchQuery ? filteredCities : popularCities).map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city);
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className={`block w-full px-4 py-2.5 text-right text-sm rounded-lg transition-colors ${
                        selectedCity === city 
                        ? "bg-red-50 text-red-600 font-bold" 
                        : "text-gray-700 hover:bg-black/5 hover:text-red-600"
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                  {searchQuery && filteredCities.length === 0 && (
                    <div className="px-4 py-3 text-center text-sm text-gray-500">
                      شهری یافت نشد
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/login"
            className="hidden px-2 text-sm font-bold text-gray-700 hover:text-red-600 md:block"
          >
            ورود
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-black active:scale-95"
          >
            <User className="h-4 w-4" />
            <span>ثبت‌نام</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
