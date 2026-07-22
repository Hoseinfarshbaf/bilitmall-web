"use client";

import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { EventItem } from "@/lib/events/types";
import EventBookingFlow from "@/components/events/EventBookingFlow";
import EventCoverLayout from "@/components/events/EventCoverLayout";
import MyEventOrganizerHome from "@/components/my-event/MyEventOrganizerHome";
import type { OrganizerEventCardData } from "@/components/my-event/MyEventOrganizerEventCard";
import { formatEventDateDisplay, getEventSchedule } from "@/lib/events/date-utils";
import { isEventUnavailable } from "@/lib/events/status";
import { MY_EVENT_BRAND } from "@/lib/my-event/constants";
import {
  getMyEventEventHref,
  getMyEventOrganizerHomeHref,
} from "@/lib/my-event/domains";
import { useEventPageTheme } from "@/lib/events/event-page-theme";
import { cn } from "@/lib/utils";

type MyEventPublicPageProps = {
  organizer: {
    slug: string;
    displayName: string;
    bio: string | null;
    coverImage: string;
    logoImage: string;
  };
  event: EventItem | null;
  description?: string | null;
  allEvents: OrganizerEventCardData[];
  currentPublicEventSlug?: string;
  onSubdomain?: boolean;
};

export default function MyEventPublicPage({
  organizer,
  event,
  description,
  allEvents,
  currentPublicEventSlug,
  onSubdomain = false,
}: MyEventPublicPageProps) {
  const {
    surfaceCard,
    accentText,
    accentIcon,
    mutedText,
    subtleText,
    titleText,
    chipActiveOrganizer,
    chipIdleOrganizer,
    footerMuted,
  } = useEventPageTheme("organizer");

  const homeHref = getMyEventOrganizerHomeHref(organizer.slug, { onSubdomain });

  if (!event) {
    return (
      <MyEventOrganizerHome
        organizer={organizer}
        allEvents={allEvents}
        onSubdomain={onSubdomain}
      />
    );
  }

  const coverImage = event.image || organizer.coverImage;
  const schedule = getEventSchedule(event);
  const unavailable = isEventUnavailable(event);

  return (
    <EventCoverLayout
      coverImage={coverImage}
      title={event.title}
      city={event.city}
      place={event.place}
      placeAddress={event.placeAddress}
      dateDisplay={formatEventDateDisplay(event)}
      backHref={homeHref}
      backLabel="همه رویدادها"
      variant="organizer"
    >
      {allEvents.length > 1 ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {allEvents.map((item) => (
            <Link
              key={item.publicEventSlug}
              href={getMyEventEventHref(organizer.slug, item.publicEventSlug, {
                onSubdomain,
              })}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition",
                item.publicEventSlug === currentPublicEventSlug
                  ? chipActiveOrganizer
                  : chipIdleOrganizer
              )}
            >
              {item.title}
            </Link>
          ))}
        </div>
      ) : null}

      <div className={cn("mb-6 p-4", surfaceCard)}>
        <div className="flex items-start gap-4">
          {organizer.logoImage ? (
            <Link
              href={homeHref}
              className="h-14 w-14 shrink-0 rounded-xl border border-brand-500/30 bg-cover bg-center transition hover:ring-2 hover:ring-brand-400/50"
              style={{ backgroundImage: `url(${organizer.logoImage})` }}
              aria-label={`بازگشت به صفحه ${organizer.displayName}`}
            />
          ) : null}
          <div className={cn("min-w-0 flex-1 space-y-2 text-sm", mutedText)}>
            <Link href={homeHref} className={cn("font-black hover:underline", accentText)}>
              {organizer.displayName}
            </Link>
            <p className="flex items-center gap-2">
              <CalendarDays className={cn("h-4 w-4 shrink-0", accentIcon)} />
              {formatEventDateDisplay(event)}
            </p>
            <p className="flex items-start gap-2">
              <MapPin className={cn("mt-0.5 h-4 w-4 shrink-0", accentIcon)} />
              <span>
                <span className={cn("block font-bold", titleText)}>{event.place}</span>
                {event.placeAddress ? (
                  <span className={cn("mt-0.5 block", subtleText)}>{event.placeAddress}</span>
                ) : null}
              </span>
            </p>
            {description ? (
              <p className={cn("pt-2 leading-7", mutedText)}>{description}</p>
            ) : null}
          </div>
        </div>
      </div>

      <EventBookingFlow
        eventId={event.id}
        eventTitle={event.title}
        eventPrice={event.price}
        place={event.place}
        city={event.city}
        schedule={schedule}
        unavailable={unavailable}
        unavailableMessage="این رویداد در دسترس نیست"
        ticketingType={event.ticketingType}
        hasAssignedSeating={event.hasAssignedSeating}
        variant="organizer"
      />

      <p className={cn("mt-8 text-center text-xs", footerMuted)}>
        {MY_EVENT_BRAND} — متصل به بلیت‌مال
      </p>
    </EventCoverLayout>
  );
}
