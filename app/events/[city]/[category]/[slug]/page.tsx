import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
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
  const singleDay = schedule.length === 1 ? schedule[0] : undefined;
  const singleSession =
    singleDay && singleDay.sessions.length === 1 ? singleDay.sessions[0] : undefined;
  const sessionTime = singleSession?.time;

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
      category={event.category}
      city={event.city}
      place={event.place}
      placeAddress={event.placeAddress}
      dateDisplay={dateDisplay}
      sessionTime={sessionTime}
      statusLabel={statusLabel}
      badge={event.badge}
      unavailable={unavailable}
      backHref={backHref}
      backLabel="بازگشت به فهرست"
      variant="bilitmall"
    >
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
