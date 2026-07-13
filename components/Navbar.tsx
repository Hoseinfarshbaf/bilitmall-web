//  نوبار
"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCity } from "@/components/CityContext";
import { useCities } from "@/components/CitiesProvider";
import { useAuth } from "@/components/AuthProvider";
import CityPickerPanel from "@/components/CityPickerPanel";
import ThemeToggle from "@/components/ThemeToggle";
import { ChevronDown, Ticket, User, MapPin, CreditCard, Settings, LogOut, Headset, Heart } from "lucide-react";
import { buildDiscoveryPageUrl } from "@/lib/events/helpers";

export default function Navbar() {
  const router = useRouter();
  const { selectedCity, setSelectedCity } = useCity();
  const { cities, topCities } = useCities();
  const { user: authUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const userDropdownRef = useRef<HTMLDivElement | null>(null);

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
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/85 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/85">
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
              className="text-sm font-bold text-neutral-600 transition hover:text-red-600 dark:text-neutral-300 dark:hover:text-red-400"
            >
              کنسرت
            </Link>
            <Link
              href={buildDiscoveryPageUrl(selectedCity, "تئاتر")}
              className="text-sm font-bold text-neutral-600 transition hover:text-red-600 dark:text-neutral-300 dark:hover:text-red-400"
            >
              تئاتر
            </Link>
            <Link
              href={buildDiscoveryPageUrl(selectedCity, "ایونت")}
              className="text-sm font-bold text-neutral-600 transition hover:text-red-600 dark:text-neutral-300 dark:hover:text-red-400"
            >
              ایونت
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle size="sm" />

          <Link
            href="/contact"
            aria-label="تماس و پشتیبانی"
            title="نیاز به کمک دارید؟ پشتیبانی"
            className="group flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-2 font-bold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 hover:shadow md:px-4 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/15"
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
              className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <MapPin className="h-4 w-4 text-red-600" />
              <span>{selectedCity}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* دراپ‌داون شیشه‌ای - اصلاح موقعیت به سمت راست برای تراز شدن */}
            {isOpen ? (
              <div className="absolute right-[-40] z-50 mt-2">
                <CityPickerPanel
                  cities={cities}
                  topCities={topCities}
                  selectedCity={selectedCity}
                  onSelect={(city) => {
                    setSelectedCity(city);
                    setIsOpen(false);
                  }}
                />
              </div>
            ) : null}
          </div>

          {authUser ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setIsUserOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-2 py-1.5 pl-3 text-sm font-bold text-neutral-700 shadow-sm transition hover:border-red-200 hover:text-red-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-red-500/40 dark:hover:text-red-400"
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
                <div className="absolute left-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/95 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl animate-in fade-in zoom-in duration-150 dark:border-neutral-700 dark:bg-neutral-900/95 dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
                  <div className="border-b border-neutral-200/60 bg-linear-to-l from-red-50 to-white px-4 py-3 dark:border-neutral-700 dark:from-red-500/10 dark:to-neutral-900">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">وارد شده با نام</p>
                    <p className="truncate text-sm font-black text-neutral-900 dark:text-neutral-100">{authUser.name}</p>
                  </div>

                  <div className="p-1.5">
                    <Link
                      href="/account"
                      onClick={() => setIsUserOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-neutral-700 transition hover:bg-red-50 hover:text-red-600 dark:text-neutral-200 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                      <Ticket className="h-4 w-4" />
                      بلیت‌های من
                    </Link>
                    <Link
                      href="/account/favorites"
                      onClick={() => setIsUserOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-neutral-700 transition hover:bg-red-50 hover:text-red-600 dark:text-neutral-200 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                      <Heart className="h-4 w-4" />
                      علاقه‌مندی‌ها
                    </Link>
                    <Link
                      href="/account/payments"
                      onClick={() => setIsUserOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-neutral-700 transition hover:bg-red-50 hover:text-red-600 dark:text-neutral-200 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                      <CreditCard className="h-4 w-4" />
                      پرداخت‌ها
                    </Link>
                    <Link
                      href="/account/profile"
                      onClick={() => setIsUserOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-neutral-700 transition hover:bg-red-50 hover:text-red-600 dark:text-neutral-200 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                      <Settings className="h-4 w-4" />
                      ویرایش حساب
                    </Link>
                  </div>

                  <div className="border-t border-neutral-200/60 p-1.5 dark:border-neutral-700">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
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
                className="hidden px-2 text-sm font-bold text-neutral-700 hover:text-red-600 dark:text-neutral-300 dark:hover:text-red-400 md:block"
              >
                ورود
              </Link>
              <Link
                href="/auth/register"
                className="flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-black active:scale-95 dark:bg-red-600 dark:hover:bg-red-500"
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
