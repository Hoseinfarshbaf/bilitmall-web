"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, MapPin } from "lucide-react";
import EventFramedImage from "@/components/EventFramedImage";
import ThemeToggle from "@/components/ThemeToggle";
import { getEventImageUrl } from "@/lib/events/helpers";
import { useEventPageTheme } from "@/lib/events/event-page-theme";
import { cn } from "@/lib/utils";

type EventCoverLayoutProps = {
  coverImage: string;
  title: string;
  subtitle?: string;
  category?: string;
  city?: string;
  place?: string;
  placeAddress?: string;
  dateDisplay?: string;
  sessionTime?: string;
  statusLabel?: string;
  badge?: string;
  unavailable?: boolean;
  backHref?: string;
  backLabel?: string;
  variant?: "bilitmall" | "organizer";
  children: ReactNode;
};

export default function EventCoverLayout({
  coverImage,
  title,
  subtitle,
  category,
  city,
  place,
  placeAddress,
  dateDisplay,
  sessionTime,
  statusLabel,
  badge,
  unavailable,
  backHref,
  backLabel = "بازگشت",
  variant = "bilitmall",
  children,
}: EventCoverLayoutProps) {
  const { isDark, accentText, accentIcon, heroCard, backBtn, mutedText, subtleText, titleText } =
    useEventPageTheme(variant);
  const coverUrl = getEventImageUrl(coverImage);
  const hasStructuredMeta = Boolean(dateDisplay && place && city);
  const eyebrow = variant === "bilitmall" ? "خرید بلیت" : "رویداد";

  return (
    <main
      className={cn(
        "relative min-h-screen transition-colors duration-200",
        isDark ? "text-white" : "text-neutral-900"
      )}
      dir="rtl"
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div
          className={cn(
            "absolute left-1/2 top-1/2 h-[150%] w-[150%] max-w-none -translate-x-1/2 -translate-y-1/2 bg-cover bg-center blur-3xl",
            isDark ? "brightness-90 saturate-125" : "brightness-105 saturate-125"
          )}
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
        <div
          className={cn("absolute inset-0", isDark ? "bg-black/72" : "bg-white/84")}
        />
        <div
          className={cn(
            "absolute inset-0",
            isDark
              ? "bg-linear-to-b from-black/25 via-black/55 to-neutral-950"
              : "bg-linear-to-b from-white/50 via-neutral-50/92 to-neutral-100"
          )}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-12 pt-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold backdrop-blur transition",
                backBtn
              )}
            >
              <ArrowRight className="h-4 w-4" />
              {backLabel}
            </Link>
          ) : (
            <div />
          )}
          <ThemeToggle size="sm" showLabel={false} />
        </div>

        <section
          className={cn(
            "mb-6 overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-md",
            heroCard
          )}
        >
          <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,156px)_1fr] sm:items-start">
            <div
              className={cn(
                "relative mx-auto aspect-3/4 w-full max-w-[180px] overflow-hidden rounded-2xl shadow-lg",
                isDark ? "ring-1 ring-white/15" : "ring-1 ring-neutral-200/90"
              )}
            >
              <EventFramedImage image={coverImage} />
            </div>

            <div className="min-w-0">
              <p className={cn("text-xs font-bold tracking-wide", accentText)}>{eyebrow}</p>

              {category ? (
                <span
                  className={cn(
                    "mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                    isDark
                      ? "bg-white/10 text-white/80"
                      : "bg-neutral-100 text-neutral-600"
                  )}
                >
                  {category}
                </span>
              ) : null}

              <h1
                className={cn(
                  "mt-2 text-2xl font-black leading-tight sm:text-3xl",
                  titleText
                )}
              >
                {title}
              </h1>

              {subtitle && !hasStructuredMeta ? (
                <p className={cn("mt-2 text-sm leading-7", mutedText)}>{subtitle}</p>
              ) : null}

              {hasStructuredMeta ? (
                <div className="mt-4 space-y-3">
                  <div
                    className={cn(
                      "flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2.5 text-sm",
                      isDark ? "bg-white/5" : "bg-neutral-50"
                    )}
                  >
                    <CalendarDays className={cn("h-4 w-4 shrink-0", accentIcon)} />
                    <span className={cn("font-bold", titleText)}>{dateDisplay}</span>
                    {unavailable && statusLabel ? (
                      <span
                        className={cn(
                          "mr-auto rounded-full px-2 py-0.5 text-xs font-bold",
                          isDark
                            ? "bg-white/15 text-white/90"
                            : "bg-neutral-200 text-neutral-700"
                        )}
                      >
                        {statusLabel}
                      </span>
                    ) : badge ? (
                      <span
                        className={cn(
                          "mr-auto rounded-full px-2 py-0.5 text-xs font-bold",
                          variant === "bilitmall"
                            ? isDark
                              ? "bg-red-500/30 text-red-200"
                              : "bg-red-100 text-red-700"
                            : isDark
                              ? "bg-emerald-500/30 text-emerald-200"
                              : "bg-emerald-100 text-emerald-800"
                        )}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </div>

                  {sessionTime ? (
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm",
                        isDark ? "bg-white/5" : "bg-neutral-50"
                      )}
                    >
                      <Clock className={cn("h-4 w-4 shrink-0", accentIcon)} />
                      <span className={cn("font-bold", titleText)}>سانس {sessionTime}</span>
                    </div>
                  ) : null}

                  <div
                    className={cn(
                      "flex items-start gap-2 rounded-2xl px-3 py-2.5 text-sm",
                      isDark ? "bg-white/5" : "bg-neutral-50"
                    )}
                  >
                    <MapPin className={cn("mt-0.5 h-4 w-4 shrink-0", accentIcon)} />
                    <div className="min-w-0">
                      <p className={cn("font-bold", titleText)}>
                        {place}
                        <span className={cn("font-normal", mutedText)}> — {city}</span>
                      </p>
                      {placeAddress ? (
                        <p className={cn("mt-1 leading-6", subtleText)}>{placeAddress}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {children}
      </div>
    </main>
  );
}
