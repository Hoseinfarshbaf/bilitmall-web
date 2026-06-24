"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useCity } from "@/components/CityContext";
import { ChevronDown, Ticket, User, MapPin } from "lucide-react";

const cities = ["تهران", "اصفهان", "شیراز", "تبریز", "مشهد"];

export default function Navbar() {
  const { selectedCity, setSelectedCity } = useCity();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* سمت راست: لوگو و لینک‌های اصلی */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-black text-red-600"
          >
            <Ticket className="h-8 w-8" />
            <span>بلیت‌مال</span>
          </Link>

          <nav className="hidden gap-6 md:flex">
            <Link
              href="/events/sports"
              className="text-sm font-bold text-gray-600 transition hover:text-red-600"
            >
              ورزش
            </Link>

            <Link
              href="/events/concerts"
              className="text-sm font-bold text-gray-600 transition hover:text-red-600"
            >
              کنسرت
            </Link>

            <Link
              href="/events/theater"
              className="text-sm font-bold text-gray-600 transition hover:text-red-600"
            >
              تئاتر
            </Link>
          </nav>
        </div>

        {/* سمت چپ: انتخاب شهر و دکمه‌های ورود */}
        <div className="flex items-center gap-3">
          {/* بخش انتخاب شهر */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <MapPin className="h-4 w-4 text-red-600" />
              <span>{selectedCity}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                {cities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setSelectedCity(city);
                      setIsOpen(false);
                    }}
                    className={`block w-full px-4 py-3 text-right text-sm font-medium transition-colors hover:bg-red-50 hover:text-red-600 ${
                      selectedCity === city
                        ? "bg-red-50 text-red-600"
                        : "text-gray-700"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mx-1 hidden h-6 w-px bg-gray-200 md:block" />

          <Link
            href="/login"
            className="hidden px-2 text-sm font-bold text-gray-700 hover:text-red-600 md:block"
          >
            ورود
          </Link>

          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-black hover:shadow-lg active:scale-95"
          >
            <User className="h-4 w-4" />
            <span>ثبت‌نام</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
