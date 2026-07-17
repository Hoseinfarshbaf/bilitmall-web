"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { useCity } from "@/components/CityContext";
import { formatEventDateDisplay } from "@/lib/events/date-utils";
import {
  getEventBannerImageUrl,
  getEventUrl,
  getFeaturedEventsFromList,
} from "@/lib/events/helpers";
import EventFramedImage from "@/components/EventFramedImage";
import { EVENT_BANNER_IMAGE } from "@/lib/events/image-specs";

const AUTO_INTERVAL_MS = 5000;

export default function SpecialOffers() {
  const { selectedCity } = useCity();
  const { events, loading } = useEvents();

  const slides = useMemo(
    () => getFeaturedEventsFromList(events, selectedCity),
    [events, selectedCity]
  );

  const slideKey = useMemo(() => slides.map((s) => s.id).join(","), [slides]);
  const multi = slides.length > 1;

  const [activeIndex, setActiveIndex] = useState(0);
  const [trackedSlideKey, setTrackedSlideKey] = useState(slideKey);
  if (slideKey !== trackedSlideKey) {
    setTrackedSlideKey(slideKey);
    setActiveIndex(0);
  }

  const goTo = useCallback(
    (index: number) => {
      if (slides.length === 0) return;
      setActiveIndex((index + slides.length) % slides.length);
    },
    [slides.length]
  );

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
    <section className="mx-auto max-w-6xl px-4 pt-4 md:pt-8">
      <div className="group relative w-full overflow-hidden rounded-2xl shadow-lg md:rounded-[28px]">
        <div
          className="relative w-full"
          style={{ aspectRatio: `${EVENT_BANNER_IMAGE.width} / ${EVENT_BANNER_IMAGE.height}` }}
        >
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
                <EventFramedImage variant="banner" image={getEventBannerImageUrl(event)} />
                <div className="absolute inset-0 bg-linear-to-tl from-black/90 via-black/45 to-transparent" />

                <div className="absolute right-4 top-4 z-20 md:right-5 md:top-5 lg:right-7 lg:top-7">
                  <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black text-white shadow-lg backdrop-blur-md md:px-4 md:py-1.5 md:text-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                    پیشنهاد ویژه
                  </span>
                </div>

                <div className="relative flex h-full flex-col items-start justify-end p-4 pb-11 text-right text-white md:p-5 md:pb-10 lg:p-6 lg:pb-11">
                  <h3 className="line-clamp-2 max-w-2xl text-base font-extrabold leading-snug tracking-tight drop-shadow-md md:text-lg lg:text-2xl">
                    {event.title}
                  </h3>
                  <div className="mt-2.5 flex flex-col items-start gap-2 text-xs font-semibold text-white/90 md:mt-3 md:flex-row md:flex-wrap md:items-center md:gap-2.5 md:text-[13px] lg:text-sm">
                    <span className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10 backdrop-blur-sm">
                      <CalendarDays className="h-4 w-4 shrink-0 text-red-300" />
                      <span className="truncate">{formatEventDateDisplay(event)}</span>
                    </span>
                    <span className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10 backdrop-blur-sm">
                      <MapPin className="h-4 w-4 shrink-0 text-red-300" />
                      <span className="truncate">{event.place}</span>
                    </span>
                    <span className="inline-flex min-h-9 items-center gap-1 text-red-300 opacity-100 transition-all duration-300 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100">
                      <span className="font-black">مشاهده و خرید</span>
                      <ArrowLeft className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}

        </div>

        {multi ? (
          <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5 md:gap-2">
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
                className={`rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? "h-2.5 w-9 bg-white md:h-2 md:w-8"
                    : "h-2.5 w-2.5 bg-white/50 hover:bg-white/80 md:h-2 md:w-2"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
