"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type EventCoverAmbientProps = {
  coverUrl: string;
  isDark: boolean;
};

const TILES_PER_HALF = 8;
const PX_PER_SECOND = 48;

/**
 * پس‌زمینه صفحه خرید: کاورها بلافاصله، چسبیده، حرکت نرم راست→چپ، لوپ بی‌وقفه.
 * حرکت با requestAnimationFrame تا به RTL و reduce-motion وابسته نباشد.
 */
export default function EventCoverAmbient({ coverUrl, isDark }: EventCoverAmbientProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const halfWidthRef = useRef(0);
  const offsetRef = useRef(0);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);

  useLayoutEffect(() => {
    document.documentElement.classList.add("event-purchase-page");
    document.body.classList.add("event-purchase-page");
    return () => {
      document.documentElement.classList.remove("event-purchase-page");
      document.body.classList.remove("event-purchase-page");
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      halfWidthRef.current = track.scrollWidth / 2;
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);

    const tick = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.064);
      lastTsRef.current = ts;

      const half = halfWidthRef.current;
      if (half > 0) {
        offsetRef.current += PX_PER_SECOND * dt;
        if (offsetRef.current >= half) {
          offsetRef.current -= half;
        }
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      lastTsRef.current = 0;
    };
  }, [coverUrl]);

  const tiles = Array.from({ length: TILES_PER_HALF * 2 }, (_, i) => i);

  return (
    <div className="event-cover-marquee" dir="ltr" aria-hidden>
      <div
        className={cn(
          "event-cover-marquee__backdrop",
          isDark ? "bg-neutral-950" : "bg-neutral-900"
        )}
      />

      <div className="event-cover-marquee__viewport">
        <div ref={trackRef} className="event-cover-marquee__track">
          {tiles.map((i) => (
            <div key={i} className="event-cover-marquee__tile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                alt=""
                draggable={false}
                loading="eager"
                decoding="async"
                fetchPriority={i < 4 ? "high" : "auto"}
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "event-cover-marquee__overlay",
          isDark ? "event-cover-marquee__overlay--dark" : "event-cover-marquee__overlay--light"
        )}
      />
    </div>
  );
}
