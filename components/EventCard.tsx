import { CalendarDays, MapPin, Heart } from "lucide-react";
import Link from "next/link";
import type { EventItem } from "@/lib/events/types";
import { getEventImageStyle, getEventUrl } from "@/lib/events/helpers";
import { formatEventDateDisplay } from "@/lib/events/date-utils";
import { getEventStatusLabel, isEventUnavailable, resolveEventStatus } from "@/lib/events/status";

export default function EventCard({ event }: { event: EventItem }) {
  const status = resolveEventStatus(event);
  const unavailable = isEventUnavailable(event);
  const statusLabel = getEventStatusLabel(event);
  const href = getEventUrl(event);
  const isExternal = href.startsWith("http");

  const article = (
    <article className="relative w-[88vw] sm:w-[300px] shrink-0 overflow-hidden rounded-3xl bg-neutral-900 shadow-sm transition hover:-translate-y-1 hover:shadow-xl aspect-[3/4]">
      <div
        className="absolute inset-0 bg-neutral-800 bg-cover bg-center"
        style={getEventImageStyle(event.image)}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

      <button
        type="button"
        onClick={(e) => e.preventDefault()}
        className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm text-white transition hover:bg-black/40"
        aria-label="افزودن به علاقه‌مندی‌ها"
      >
        <Heart className="h-5 w-5" />
      </button>

      {unavailable ? (
        <span className="absolute right-4 top-4 z-10 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1 text-xs font-bold text-white">
          {statusLabel}
        </span>
      ) : event.badge ? (
        <span className="absolute right-4 top-4 z-10 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
          {event.badge}
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-10 p-5">
        <h3 className="line-clamp-1 text-lg font-black text-white">{event.title}</h3>
        <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-white/80">
          <CalendarDays className="h-4 w-4" />
          <span>{formatEventDateDisplay(event)}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-white/70">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{event.place}</span>
        </div>
      </div>
    </article>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {article}
      </a>
    );
  }

  return <Link href={href}>{article}</Link>;
}
