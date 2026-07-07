"use client";

import PopularEvents from "@/components/PopularEvents";
import SearchBar from "@/components/SearchBar";
import SpecialOffers from "@/components/SpecialOffers";
import CategorySlider from "@/components/CategorySlider";
import OrganizerCta from "@/components/OrganizerCta";
import { useEvents } from "@/hooks/useEvents";
import { useCity } from "@/components/CityContext";
import { getCityEventsFromList } from "@/lib/events/helpers";
import { useMemo } from "react";

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
    <main className="min-h-screen bg-neutral-50 pb-20">
      <SpecialOffers />

      <section className="py-6">
        <div className="mx-auto max-w-6xl px-4">
          <SearchBar />
        </div>
      </section>

      <PopularEvents />

      <section className="mt-10">
        <div className="mx-auto max-w-6xl px-4">
          {loading ? (
            <p className="py-20 text-center text-neutral-500">در حال بارگذاری رویدادها...</p>
          ) : !hasAnySection ? (
            <div className="rounded-3xl border-2 border-dashed border-neutral-200 bg-white py-20 text-center">
              <p className="text-lg font-black text-neutral-800">
                رویدادی برای شهر {selectedCity} موجود نیست.
              </p>
              <p className="mt-2 text-sm text-neutral-500">
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
