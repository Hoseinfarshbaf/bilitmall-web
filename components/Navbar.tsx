//  نوبار
"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCity } from "@/components/CityContext";
import { useCities } from "@/components/CitiesProvider";
import { useAuth } from "@/components/AuthProvider";
import { ChevronDown, Ticket, User, MapPin, Search, CreditCard, Settings, LogOut, Headset } from "lucide-react";
import { buildDiscoveryPageUrl } from "@/lib/events/helpers";

export default function Navbar() {
  const router = useRouter();
  const { selectedCity, setSelectedCity } = useCity();
  const { cities, popularCities } = useCities();
  const { user: authUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const userDropdownRef = useRef<HTMLDivElement | null>(null);

  const filteredCities = cities.filter((city) => city.includes(searchQuery));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    setIsUserOpen(false);
    router.push("/");
    router.refresh();
  }

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
              href={buildDiscoveryPageUrl(selectedCity, "کنسرت")}
              className="text-sm font-bold text-gray-600 transition hover:text-red-600"
            >
              کنسرت
            </Link>
            <Link
              href={buildDiscoveryPageUrl(selectedCity, "تئاتر")}
              className="text-sm font-bold text-gray-600 transition hover:text-red-600"
            >
              تئاتر
            </Link>
            <Link
              href={buildDiscoveryPageUrl(selectedCity, "ایونت")}
              className="text-sm font-bold text-gray-600 transition hover:text-red-600"
            >
              ایونت
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            aria-label="تماس و پشتیبانی"
            title="نیاز به کمک دارید؟ پشتیبانی"
            className="group flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-2 font-bold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 hover:shadow md:px-4"
          >
            <span className="relative flex h-6 w-6 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/40 opacity-75 group-hover:opacity-100" />
              <Headset className="relative h-5 w-5" />
            </span>
            <span className="hidden text-sm md:inline">پشتیبانی</span>
          </Link>

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
                  {(searchQuery ? filteredCities : popularCities.length > 0 ? popularCities : cities.slice(0, 5)).map((city) => (
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

          {authUser ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setIsUserOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1.5 pl-3 text-sm font-bold text-gray-700 shadow-sm transition hover:border-red-200 hover:text-red-600"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-xs font-black text-white">
                  {authUser.name.trim().charAt(0) || "؟"}
                </span>
                <span className="hidden max-w-[120px] truncate sm:inline">{authUser.name}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isUserOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isUserOpen && (
                <div className="absolute left-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl animate-in fade-in zoom-in duration-150">
                  <div className="border-b border-gray-200/60 bg-linear-to-l from-red-50 to-white px-4 py-3">
                    <p className="text-xs text-gray-500">وارد شده با نام</p>
                    <p className="truncate text-sm font-black text-gray-900">{authUser.name}</p>
                  </div>

                  <div className="p-1.5">
                    <Link
                      href="/account"
                      onClick={() => setIsUserOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Ticket className="h-4 w-4" />
                      بلیت‌های من
                    </Link>
                    <Link
                      href="/account/payments"
                      onClick={() => setIsUserOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <CreditCard className="h-4 w-4" />
                      پرداخت‌ها
                    </Link>
                    <Link
                      href="/account/profile"
                      onClick={() => setIsUserOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Settings className="h-4 w-4" />
                      ویرایش حساب
                    </Link>
                  </div>

                  <div className="border-t border-gray-200/60 p-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                    >
                      <LogOut className="h-4 w-4" />
                      خروج
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="hidden px-2 text-sm font-bold text-gray-700 hover:text-red-600 md:block"
              >
                ورود
              </Link>
              <Link
                href="/auth/register"
                className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-black active:scale-95"
              >
                <User className="h-4 w-4" />
                <span>ثبت‌نام</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
