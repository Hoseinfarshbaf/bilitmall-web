"use client";

import { ArrowLeft } from "lucide-react";
import { getEventImageUrl } from "@/lib/events/helpers";
import { MY_EVENT_BRAND } from "@/lib/my-event/constants";
import { getMyEventEventHref } from "@/lib/my-event/domains";
import MyEventOrganizerEventCard, {
  type OrganizerEventCardData,
} from "@/components/my-event/MyEventOrganizerEventCard";

type Props = {
  organizer: {
    slug: string;
    displayName: string;
    bio: string | null;
    coverImage: string;
    logoImage: string;
  };
  allEvents: OrganizerEventCardData[];
  onSubdomain?: boolean;
};

export default function MyEventOrganizerHome({
  organizer,
  allEvents,
  onSubdomain = false,
}: Props) {
  const coverUrl = getEventImageUrl(organizer.coverImage);
  const hasLogo = Boolean(organizer.logoImage?.trim());
  const initial = organizer.displayName.trim().charAt(0) || "؟";
  const eventCount = allEvents.length;

  return (
    <main className="relative min-h-screen bg-[#0c1210] text-white" dir="rtl">
      <style>{`
        @keyframes org-hero-ken {
          from { transform: scale(1.04); }
          to { transform: scale(1.12); }
        }
        .org-hero-bg {
          animation: org-hero-ken 18s ease-in-out infinite alternate;
        }
        @media (prefers-reduced-motion: reduce) {
          .org-hero-bg { animation: none; }
        }
      `}</style>

      <section className="relative isolate min-h-[min(88vh,720px)] overflow-hidden">
        <div
          aria-hidden
          className="org-hero-bg absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-[#0c1210]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,rgba(134,71,253,0.22),transparent_55%)]"
        />

        <div className="relative mx-auto flex min-h-[min(88vh,720px)] max-w-5xl flex-col justify-end px-5 pb-16 pt-10 sm:px-8 sm:pb-20">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
            <div className="mb-6 flex items-end gap-4 sm:gap-5">
              {hasLogo ? (
                <div
                  className="h-20 w-20 shrink-0 rounded-[1.35rem] bg-cover bg-center shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-2 ring-white/25 sm:h-24 sm:w-24 sm:rounded-[1.5rem]"
                  style={{ backgroundImage: `url(${organizer.logoImage})` }}
                  role="img"
                  aria-label={`لوگوی ${organizer.displayName}`}
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.35rem] bg-brand-500/20 text-3xl font-black text-brand-200 ring-2 ring-white/20 sm:h-24 sm:w-24 sm:rounded-[1.5rem] sm:text-4xl">
                  {initial}
                </div>
              )}
              <div className="min-w-0 pb-1">
                <p className="mb-2 text-[11px] font-bold tracking-[0.22em] text-brand-300/90">
                  برگزارکننده
                </p>
                <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl">
                  {organizer.displayName}
                </h1>
              </div>
            </div>

            {organizer.bio ? (
              <p className="max-w-xl text-base leading-8 text-white/75 sm:text-lg sm:leading-9">
                {organizer.bio}
              </p>
            ) : null}

            {eventCount > 0 ? (
              <a
                href="#events"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-neutral-900 transition hover:bg-brand-50 active:scale-[0.98]"
              >
                مشاهده رویدادها
                <ArrowLeft className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section
        id="events"
        className="relative bg-gradient-to-b from-[#0c1210] via-[#111a17] to-[#0e1412] px-5 pb-20 pt-4 sm:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              رویدادها
            </h2>
            <p className="mt-2 text-sm text-white/50">
              {eventCount > 0
                ? `${eventCount} رویداد فعال — برای خرید بلیت انتخاب کنید`
                : "هنوز رویدادی منتشر نشده است"}
            </p>
          </div>

          {eventCount > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {allEvents.map((item, index) => (
                <div
                  key={item.publicEventSlug}
                  className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both"
                  style={{
                    animationDelay: `${180 + index * 70}ms`,
                    animationDuration: "550ms",
                  }}
                >
                  <MyEventOrganizerEventCard
                    event={item}
                    href={getMyEventEventHref(
                      organizer.slug,
                      item.publicEventSlug,
                      { onSubdomain }
                    )}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] px-6 py-16 text-center backdrop-blur-sm">
              <p className="text-base font-bold text-white/70">
                رویداد فعالی برای نمایش وجود ندارد.
              </p>
              <p className="mt-2 text-sm text-white/40">
                به‌زودی رویدادهای جدید اینجا منتشر می‌شوند.
              </p>
            </div>
          )}

          <p className="mt-14 text-center text-xs text-white/30">
            {MY_EVENT_BRAND} — متصل به بلیت‌مال
          </p>
        </div>
      </section>
    </main>
  );
}
