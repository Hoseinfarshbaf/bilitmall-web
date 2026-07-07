"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { useCity } from "@/components/CityContext";
import { formatEventDateDisplay } from "@/lib/events/date-utils";
import {
  getEventBannerImageStyle,
  getEventUrl,
  getFeaturedEventsFromList,
} from "@/lib/events/helpers";

const AUTO_INTERVAL_MS = 5000;

export default function SpecialOffers() {
  const { selectedCity } = useCity();
  const { events, loading } = useEvents();
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = useMemo(
    () => getFeaturedEventsFromList(events, selectedCity),
    [events, selectedCity]
  );

  const slideKey = useMemo(() => slides.map((s) => s.id).join(","), [slides]);
  const multi = slides.length > 1;

  const goTo = useCallback(
    (index: number) => {
      if (slides.length === 0) return;
      setActiveIndex((index + slides.length) % slides.length);
    },
    [slides.length]
  );

  const goNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [selectedCity, slideKey]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTO_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [slides.length, slideKey]);

  if (loading || slides.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pt-8">
      <div className="group relative w-full overflow-hidden rounded-[28px] shadow-lg">
        <div className="relative h-72 sm:h-80">
          {slides.map((event, index) => (
            <div
              key={event.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === activeIndex
                  ? "z-10 opacity-100"
                  : "pointer-events-none z-0 opacity-0"
              }`}
              aria-hidden={index !== activeIndex}
            >
              <Link href={getEventUrl(event)} className="relative block h-full w-full">
                <div
                  className="absolute inset-0 bg-neutral-900 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                  style={getEventBannerImageStyle(event.image)}
                />
                <div className="absolute inset-0 bg-linear-to-tl from-black/90 via-black/45 to-transparent" />

                <div className="absolute right-5 top-5 z-20 sm:right-7 sm:top-7">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-black text-white shadow-lg backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                    پیشنهاد ویژه
                  </span>
                </div>

                <div className="relative flex h-full flex-col items-end justify-end p-6 pb-14 text-right text-white sm:p-8 sm:pb-16">
                  <h3 className="line-clamp-2 text-2xl font-black leading-tight drop-shadow-md sm:text-4xl">
                    {event.title}
                  </h3>
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5 text-sm font-semibold text-white/90">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                      <CalendarDays className="h-4 w-4 text-red-300" />
                      {formatEventDateDisplay(event)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                      <MapPin className="h-4 w-4 text-red-300" />
                      {event.place}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}

          {multi ? (
            <>
              <button
                type="button"
                aria-label="اسلاید بعدی"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute left-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/70"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="اسلاید قبلی"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute right-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/70"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>

        {multi ? (
          <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
            {slides.map((event, index) => (
              <button
                key={event.id}
                type="button"
                aria-label={`اسلاید ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goTo(index);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? "w-8 bg-white"
                    : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
