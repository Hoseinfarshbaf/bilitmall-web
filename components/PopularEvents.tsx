"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { events } from "@/data/events";
import EventCard from "@/components/EventCard";
import { useCity } from "@/components/CityContext";

export default function PopularEvents() {
  const { selectedCity } = useCity();

  const cityEvents = events.filter(
    (event) => event.city === selectedCity
  );

  const fallbackEvents = events.filter(
    (event) => event.city === "تهران"
  );

  const data = cityEvents.length > 0 ? cityEvents : fallbackEvents;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-4">
        {/* header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-neutral-900">
              رویدادهای محبوب
            </h2>
            <p className="mt-1 text-sm font-medium text-neutral-500">
              در {selectedCity}
            </p>
          </div>

          <Link
            href={`/events/${selectedCity}`}
            className="flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-bold text-white"
          >
            <span>مشاهده همه</span>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        {/* marquee */}
        <div className="overflow-hidden w-full" dir="ltr">
          <div className="popular-events-track" dir="rtl">
            {[...data, ...data].map((event, index) => (
              <div key={`${event.id}-${index}`} className="slide-item">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}