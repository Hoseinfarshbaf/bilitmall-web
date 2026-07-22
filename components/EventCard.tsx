"use client";

import { CalendarDays, Heart, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EventItem } from "@/lib/events/types";
import { getEventUrl } from "@/lib/events/helpers";
import EventFramedImage from "@/components/EventFramedImage";
import { useFavorites } from "@/components/FavoritesProvider";
import { useToast } from "@/components/ToastProvider";
import { formatEventDateDisplay } from "@/lib/events/date-utils";
import { getEventStatusLabel, isEventUnavailable } from "@/lib/events/status";
import { cn } from "@/lib/utils";

export default function EventCard({ event }: { event: EventItem }) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();

  const unavailable = isEventUnavailable(event);
  const statusLabel = getEventStatusLabel(event);
  const href = getEventUrl(event);
  const isExternal = href.startsWith("http");
  const favorited = isFavorite(event.id);

  async function handleFavoriteClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    const result = await toggleFavorite(event.id);
    if (result === "login_required") {
      const next = encodeURIComponent(
        typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"
      );
      router.push(`/auth/login?next=${next}`);
      return;
    }

    if (result === "added") {
      showToast("به علاقه‌مندی‌های حساب شخصی شما اضافه شد.", {
        action: { label: "مشاهده", href: "/account/favorites" },
      });
    }
  }

  const article = (
    <article className="relative aspect-[3/4] w-[min(82vw,280px)] shrink-0 overflow-hidden rounded-3xl bg-neutral-900 shadow-sm transition active:scale-[0.98] sm:w-[300px] sm:hover:-translate-y-1 sm:hover:shadow-xl">
      <EventFramedImage image={event.image} />

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

      <button
        type="button"
        onClick={(e) => void handleFavoriteClick(e)}
        className={cn(
          "absolute left-3 top-3 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full backdrop-blur-sm transition sm:left-4 sm:top-4 sm:h-9 sm:w-9",
          favorited
            ? "bg-brand-500 text-white hover:bg-brand-600"
            : "bg-black/20 text-white hover:bg-black/40"
        )}
        aria-label={favorited ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
        aria-pressed={favorited}
      >
        <Heart className={cn("h-5 w-5", favorited && "fill-current")} />
      </button>

      {unavailable ? (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm sm:right-4 sm:top-4">
          {statusLabel}
        </span>
      ) : event.badge ? (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white sm:right-4 sm:top-4">
          {event.badge}
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5">
        <h3 className="line-clamp-2 text-base font-black text-white sm:line-clamp-1 sm:text-lg">{event.title}</h3>
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
