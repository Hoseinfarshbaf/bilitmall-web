import Link from "next/link";

import { CalendarDays, MapPin } from "lucide-react";

import type { EventItem } from "@/lib/events/types";

import EventBookingFlow from "@/components/events/EventBookingFlow";

import EventCoverLayout from "@/components/events/EventCoverLayout";

import { formatEventDateDisplay, getEventSchedule } from "@/lib/events/date-utils";

import { isEventUnavailable } from "@/lib/events/status";

import { MY_EVENT_BRAND } from "@/lib/my-event/constants";

import { getMyEventEventHref, getMyEventOrganizerHomeHref } from "@/lib/my-event/domains";



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

  allEvents: { publicEventSlug: string; title: string }[];

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

  const coverImage = event?.image || organizer.coverImage;

  const schedule = event ? getEventSchedule(event) : [];

  const unavailable = event ? isEventUnavailable(event) : true;



  if (!event) {

    return (

      <EventCoverLayout

        coverImage={coverImage}

        title={organizer.displayName}

        subtitle={organizer.bio ?? MY_EVENT_BRAND}

        variant="organizer"

      >

        <div className="rounded-3xl border border-emerald-500/20 bg-black/40 p-8 text-center text-white/70 backdrop-blur">

          رویداد فعالی برای نمایش وجود ندارد.

        </div>

      </EventCoverLayout>

    );

  }



  const homeHref = getMyEventOrganizerHomeHref(organizer.slug, { onSubdomain });



  return (

    <EventCoverLayout

      coverImage={coverImage}

      title={event.title}

      subtitle={`${organizer.displayName} · ${event.place} — ${event.city}`}

      backHref={allEvents.length > 1 ? homeHref : undefined}

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

              className={`rounded-full px-4 py-2 text-sm font-bold transition ${

                item.publicEventSlug === currentPublicEventSlug

                  ? "bg-emerald-600 text-white"

                  : "border border-white/15 bg-black/30 text-white/80 hover:bg-black/50"

              }`}

            >

              {item.title}

            </Link>

          ))}

        </div>

      ) : null}



      <div className="mb-6 rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-sm">

        <div className="flex items-start gap-4">

          {organizer.logoImage ? (

            <div

              className="h-14 w-14 shrink-0 rounded-xl border border-emerald-500/30 bg-cover bg-center"

              style={{ backgroundImage: `url(${organizer.logoImage})` }}

            />

          ) : null}

          <div className="min-w-0 flex-1 space-y-2 text-sm text-white/80">

            <p className="font-black text-emerald-400">{organizer.displayName}</p>

            <p className="flex items-center gap-2">

              <CalendarDays className="h-4 w-4 shrink-0 text-emerald-400" />

              {formatEventDateDisplay(event)}

            </p>

            <p className="flex items-start gap-2">

              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

              <span>

                <span className="block font-bold text-white">{event.place}</span>

                {event.placeAddress ? (

                  <span className="mt-0.5 block text-white/55">{event.placeAddress}</span>

                ) : null}

              </span>

            </p>

            {description ? (

              <p className="pt-2 leading-7 text-white/65">{description}</p>

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



      <p className="mt-8 text-center text-xs text-white/30">

        {MY_EVENT_BRAND} — متصل به بلیت‌مال

      </p>

    </EventCoverLayout>

  );

}

