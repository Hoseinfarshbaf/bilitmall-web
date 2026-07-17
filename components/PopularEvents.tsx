// رویداد های محبوب
"use client";

import { useMemo } from "react";
import { getPopularEventsFromList } from "@/lib/events/helpers";
import { useEvents } from "@/hooks/useEvents";
import CategorySlider from "@/components/CategorySlider";
import { useCity } from "@/components/CityContext";

export default function PopularEvents() {
  const { selectedCity } = useCity();
  const { events, loading } = useEvents();

  const data = useMemo(
    () => getPopularEventsFromList(events, selectedCity),
    [events, selectedCity]
  );

  if (loading || data.length === 0) {
    return null;
  }

  return (
    <section className="pt-6 md:pt-10">
      <div className="mx-auto max-w-6xl px-4">
        <CategorySlider
          categoryLabel="محبوب"
          cityName={selectedCity}
          data={data}
          variant="popular"
        />
      </div>
    </section>
  );
}
