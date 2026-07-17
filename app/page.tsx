"use client";

import Link from "next/link";
import PopularEvents from "@/components/PopularEvents";
import SearchBar from "@/components/SearchBar";
import SpecialOffers from "@/components/SpecialOffers";
import CategorySlider from "@/components/CategorySlider";
import OrganizerCta from "@/components/OrganizerCta";
import { useEvents } from "@/hooks/useEvents";
import { useCity } from "@/components/CityContext";
import { buildDiscoveryPageUrl, getCityEventsFromList } from "@/lib/events/helpers";
import { useMemo } from "react";

const MOBILE_CATEGORIES = [
  { label: "همه", slug: "همه" },
  { label: "کنسرت", slug: "کنسرت" },
  { label: "تئاتر", slug: "تئاتر" },
  { label: "ایونت", slug: "ایونت" },
  { label: "محبوب", slug: "محبوب" },
] as const;

export default function Home() {
  const { selectedCity } = useCity();
  const { events, loading } = useEvents();

  const cityEvents = useMemo(
    () => getCityEventsFromList(events, selectedCity),
    [events, selectedCity]
  );

  const concerts = useMemo(
    () => cityEvents.filter((e) => e.category === "کنسرت"),
    [cityEvents]
  );
  const theaters = useMemo(
    () => cityEvents.filter((e) => e.category === "تئاتر"),
    [cityEvents]
  );
  const lifestyleEvents = useMemo(
    () => cityEvents.filter((e) => e.category === "ایونت"),
    [cityEvents]
  );

  const hasAnySection =
    cityEvents.some((e) => e.featured) ||
    cityEvents.some((e) => e.popular) ||
    concerts.length > 0 ||
    theaters.length > 0 ||
    lifestyleEvents.length > 0;

  return (
    <main className="home-page min-h-screen bg-neutral-50 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] dark:bg-neutral-950 md:pb-20">
      <SpecialOffers />

      <section className="py-4 md:py-6">
        <div className="mx-auto max-w-6xl px-4">
          <SearchBar />
        </div>
      </section>

      <nav
        aria-label="دسته‌بندی رویدادها"
        className="mx-auto max-w-6xl px-4 pb-2 md:hidden"
      >
        <div className="home-category-chips flex gap-2 overflow-x-auto pb-1">
          {MOBILE_CATEGORIES.map(({ label, slug }) => (
            <Link
              key={slug}
              href={buildDiscoveryPageUrl(selectedCity, slug)}
              className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-neutral-200 bg-white px-4 text-sm font-bold text-neutral-700 shadow-sm transition active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <PopularEvents />

      <section className="mt-6 md:mt-10">
        <div className="mx-auto max-w-6xl px-4">
          {loading ? (
            <p className="py-20 text-center text-neutral-500 dark:text-neutral-400">در حال بارگذاری رویدادها...</p>
          ) : !hasAnySection ? (
            <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-white px-4 py-14 text-center md:rounded-3xl md:py-20 dark:border-neutral-700 dark:bg-neutral-900">
              <p className="text-base font-black text-neutral-800 md:text-lg dark:text-neutral-100">
                رویدادی برای شهر {selectedCity} موجود نیست.
              </p>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                شهر دیگری از منوی بالا انتخاب کنید یا بعداً سر بزنید.
              </p>
            </div>
          ) : (
            <>
              {concerts.length > 0 && (
                <CategorySlider
                  categoryLabel="کنسرت"
                  cityName={selectedCity}
                  category="کنسرت"
                  data={concerts}
                />
              )}

              {theaters.length > 0 && (
                <CategorySlider
                  categoryLabel="تئاتر"
                  cityName={selectedCity}
                  category="تئاتر"
                  data={theaters}
                />
              )}

              {lifestyleEvents.length > 0 && (
                <CategorySlider
                  categoryLabel="ایونت"
                  cityName={selectedCity}
                  category="ایونت"
                  data={lifestyleEvents}
                />
              )}
            </>
          )}
        </div>
      </section>

      <OrganizerCta />
    </main>
  );
}
