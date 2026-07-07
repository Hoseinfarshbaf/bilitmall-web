import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { CalendarDays, MapPin, Clock } from "lucide-react";

import { getEventBySlug } from "@/lib/events";

import { MY_EVENT_EVENT_SOURCE } from "@/lib/my-event/constants";

import { resolveEventPublicUrl } from "@/lib/my-event/store";

import { prisma } from "@/lib/prisma";

import {

  formatEventDateDisplay,

  getEventSchedule,

} from "@/lib/events/date-utils";

import {

  getEventStatusLabel,

  isEventUnavailable,

  resolveEventStatus,

} from "@/lib/events/status";

import EventCoverLayout from "@/components/events/EventCoverLayout";

import EventBookingFlow from "@/components/events/EventBookingFlow";

import { notFound } from "next/navigation";



type PageProps = {

  params: Promise<{ city: string; category: string; slug: string }>;

};



export async function generateMetadata({ params }: PageProps): Promise<Metadata> {

  const { slug } = await params;

  const event = await getEventBySlug(decodeURIComponent(slug));



  if (!event) {

    return { title: "رویداد یافت نشد" };

  }



  return {

    title: `${event.title} | بلیت‌مال`,

    description: `خرید بلیت ${event.title} در ${event.place}، ${event.city}`,

  };

}



export default async function EventPage({ params }: PageProps) {

  const { city, category, slug } = await params;

  const decodedCity = decodeURIComponent(city);

  const decodedCategory = decodeURIComponent(category);

  const decodedSlug = decodeURIComponent(slug);

  const event = await getEventBySlug(decodedSlug);



  if (event) {

    const raw = await prisma.event.findUnique({

      where: { slug: decodedSlug },

      include: { myEventOrganizer: { select: { slug: true } } },

    });

    if (

      raw?.source === MY_EVENT_EVENT_SOURCE &&

      raw.myEventOrganizer &&

      raw.listOnBilitmallApproved

    ) {

      redirect(

        resolveEventPublicUrl(raw.myEventOrganizer.slug, {

          title: raw.title,

          slug: raw.slug,

          publicEventSlug: raw.publicEventSlug,

        })

      );

    }

  }



  if (

    !event ||

    event.published === false ||

    event.city !== decodedCity ||

    event.category !== decodedCategory

  ) {

    return notFound();

  }



  const schedule = getEventSchedule(event);

  const status = resolveEventStatus(event);

  const unavailable = isEventUnavailable(event);

  const statusLabel = getEventStatusLabel(event);

  const dateDisplay = formatEventDateDisplay(event);



  const unavailableMessage =

    status === "cancelled"

      ? "این رویداد لغو شد"

      : status === "sold_out"

        ? "ظرفیت این رویداد تکمیل شده"

        : "این رویداد برگزار شد";



  const backHref = `/events/${encodeURIComponent(decodedCity)}/${encodeURIComponent(decodedCategory)}`;



  return (

    <EventCoverLayout

      coverImage={event.image}

      title={event.title}

      subtitle={`${event.category} · ${event.place} — ${event.city}`}

      backHref={backHref}

      backLabel="بازگشت به فهرست"

      variant="bilitmall"

    >

      <div className="mb-6 rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-sm">

        <div className="space-y-3 text-sm text-white/80">

          <div className="flex items-center gap-3">

            <CalendarDays className="h-4 w-4 shrink-0 text-red-400" />

            <span>{dateDisplay}</span>

            {unavailable ? (

              <span className="mr-auto rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold">

                {statusLabel}

              </span>

            ) : event.badge ? (

              <span className="mr-auto rounded-full bg-red-500/30 px-2 py-0.5 text-xs font-bold text-red-200">

                {event.badge}

              </span>

            ) : null}

          </div>

          {schedule.length === 1 && schedule[0].sessions.length === 1 ? (

            <div className="flex items-center gap-3">

              <Clock className="h-4 w-4 shrink-0 text-red-400" />

              <span>{schedule[0].sessions[0].time}</span>

            </div>

          ) : null}

          <div className="flex items-start gap-3">

            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

            <span>

              <span className="block font-bold text-white">{event.place}</span>

              {event.placeAddress ? (

                <span className="mt-0.5 block text-white/55">{event.placeAddress}</span>

              ) : null}

            </span>

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

        unavailableMessage={unavailableMessage}

        ticketingType={event.ticketingType}

        hasAssignedSeating={event.hasAssignedSeating}

        variant="bilitmall"

      />

    </EventCoverLayout>

  );

}

