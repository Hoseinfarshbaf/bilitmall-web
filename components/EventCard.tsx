//  کارت رویداد

import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import type { EventItem } from "@/data/events";

export default function EventCard({ event }: { event: EventItem }) {
  return (
    <Link href={`/events/detail/${event.id}`}>
      <article className="w-[260px] shrink-0 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg cursor-pointer">
        <div className="h-40 bg-[linear-gradient(135deg,#111827_0%,#dc2626_100%)]" />
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
              {event.category}
            </span>
            {event.badge ? (
              <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-bold text-white">
                {event.badge}
              </span>
            ) : null}
          </div>
          <h3 className="line-clamp-1 text-base font-black text-neutral-900">
            {event.title}
          </h3>
          <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
            <CalendarDays className="h-4 w-4 text-red-500" />
            <span>{event.date}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
            <MapPin className="h-4 w-4 text-red-500" />
            <span>{event.place}</span>
          </div>
          <div className="mt-4 text-sm font-bold text-neutral-900">
            {event.price}
          </div>
        </div>
      </article>
    </Link>
  );
}