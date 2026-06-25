// کروسل رویدادهای محبوب
"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef } from "react";
import { events } from "@/data/events";
import EventCard from "@/components/EventCard";
import { useCity } from "@/components/CityContext";

export default function PopularEvents() {
  const { selectedCity } = useCity();
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);

  const cityEvents = events.filter((event) => event.city === selectedCity);
  const fallbackEvents = events.filter((event) => event.city === "تهران");
  const data = cityEvents.length > 0 ? cityEvents : fallbackEvents;

  // چهار بار تکرار برای اطمینان از پر شدن کل فضای صفحه
  const repeatedData = [...data, ...data, ...data, ...data];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    posRef.current = 0;

    const step = () => {
      // حرکت به چپ (منفی برای RTL)
      posRef.current -= 0.5;

      const onePartWidth = track.scrollWidth / 4;

      if (Math.abs(posRef.current) >= onePartWidth) {
        posRef.current = 0;
      }

      track.style.transform = `translateX(${posRef.current}px)`;
      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [data]);

  const pauseAnim = () => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  };

  const resumeAnim = () => {
    if (animRef.current) return;
    const step = () => {
      if (!trackRef.current) return;
      posRef.current -= 0.5;
      const onePartWidth = trackRef.current.scrollWidth / 4;
      if (Math.abs(posRef.current) >= onePartWidth) {
        posRef.current = 0;
      }
      trackRef.current.style.transform = `translateX(${posRef.current}px)`;
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  };

  return (
    <section className="py-12 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4">
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
            className="flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-bold text-white transition-transform hover:scale-105"
          >
            <span>مشاهده همه</span>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        <div
          className="relative w-full overflow-hidden"
          onMouseEnter={pauseAnim}
          onMouseLeave={resumeAnim}
          style={{ direction: "ltr" }} // جهت container برای کارکرد صحیح translateX
        >
          <div
            ref={trackRef}
            className="flex gap-3"
            style={{
              width: "max-content",
              willChange: "transform",
            }}
          >
            {repeatedData.map((event, index) => (
              <div key={`${event.id}-${index}`} className="flex-shrink-0 w-fit">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
