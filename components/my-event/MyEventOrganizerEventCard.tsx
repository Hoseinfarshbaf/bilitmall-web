import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import EventFramedImage from "@/components/EventFramedImage";

export type OrganizerEventCardData = {
  publicEventSlug: string;
  title: string;
  image?: string;
  city?: string;
  place?: string;
  dateDisplay?: string;
};

type Props = {
  event: OrganizerEventCardData;
  href: string;
};

export default function MyEventOrganizerEventCard({ event, href }: Props) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-[1.5rem] bg-white/[0.04] ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.07] hover:ring-emerald-400/40 hover:shadow-[0_20px_50px_-20px_rgba(16,185,129,0.45)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <EventFramedImage image={event.image} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1210] via-[#0c1210]/55 to-transparent" />
        <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_80%,rgba(52,211,153,0.25),transparent_60%)]" />

        <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5">
          <h3 className="line-clamp-2 text-lg font-black leading-snug text-white transition group-hover:text-emerald-100">
            {event.title}
          </h3>

          <div className="mt-3 space-y-1.5 text-sm text-white/65">
            {event.dateDisplay ? (
              <p className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-emerald-300/90" />
                <span className="line-clamp-1">{event.dateDisplay}</span>
              </p>
            ) : null}
            {event.place || event.city ? (
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-300/90" />
                <span className="line-clamp-1">
                  {[event.place, event.city].filter(Boolean).join(" — ")}
                </span>
              </p>
            ) : null}
          </div>

          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-black text-emerald-300 transition group-hover:gap-2.5">
            خرید بلیت
            <ArrowLeft className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
