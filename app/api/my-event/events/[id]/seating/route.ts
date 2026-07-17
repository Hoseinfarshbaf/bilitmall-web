import { NextResponse } from "next/server";
import { getMyEventSession } from "@/lib/my-event/session";
import { getMyEventOrganizerEvent, getSessionMyEventOrganizer } from "@/lib/my-event/store";
import { MY_EVENT_LINKED_VENUE_SEATING_HINT } from "@/lib/my-event/constants";
import {
  EVENT_PRICE_PER_SEAT_LABEL,
  seatingLayoutIsFree,
} from "@/lib/events/pricing";
import {
  getEventSeatingPlan,
  resolveInitialEventSeatingLayout,
  saveEventSeatingPlan,
} from "@/lib/seating/store";
import { prisma } from "@/lib/prisma";
import type { SeatingLayout } from "@/lib/seating/types";

type RouteContext = { params: Promise<{ id: string }> };

async function authorize(eventId: number) {
  const session = await getMyEventSession();
  if (!session) return null;
  const user = await getSessionMyEventOrganizer(session);
  if (!user) return null;
  const event = await getMyEventOrganizerEvent(user.myEventOrganizerId, eventId);
  if (!event) return null;
  return { user, event };
}

export async function GET(_request: Request, context: RouteContext) {
  const eventId = Number((await context.params).id);
  const auth = await authorize(eventId);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!auth.event.hasAssignedSeating) {
    return NextResponse.json(
      { error: "این رویداد صندلی‌گذاری مشخص ندارد." },
      { status: 400 }
    );
  }

  const isLinkedVenue = Boolean(auth.event.venueTemplateId);

  const existing = await getEventSeatingPlan(eventId);
  const layout = await resolveInitialEventSeatingLayout(eventId, {
    place: auth.event.place,
    title: auth.event.title,
    venueTemplateId: auth.event.venueTemplateId,
  });

  return NextResponse.json({
    eventId,
    eventTitle: auth.event.title,
    hasSeatingPlan: Boolean(existing) || isLinkedVenue,
    layout,
    readOnly: isLinkedVenue,
    linkedVenue: auth.event.venueTemplateId
      ? { id: auth.event.venueTemplateId, name: auth.event.place }
      : null,
  });
}

export async function PUT(request: Request, context: RouteContext) {
  const eventId = Number((await context.params).id);
  const auth = await authorize(eventId);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!auth.event.hasAssignedSeating) {
    return NextResponse.json(
      { error: "این رویداد صندلی‌گذاری مشخص ندارد." },
      { status: 400 }
    );
  }

  if (auth.event.venueTemplateId) {
    return NextResponse.json(
      { error: MY_EVENT_LINKED_VENUE_SEATING_HINT },
      { status: 403 }
    );
  }

  const body = (await request.json()) as { layout?: SeatingLayout };
  if (!body.layout) {
    return NextResponse.json({ error: "نقشه سالن ارسال نشده." }, { status: 400 });
  }

  await saveEventSeatingPlan(
    eventId,
    {
      ...body.layout,
      name: body.layout.name?.trim() || auth.event.place,
    },
    body.layout.name?.trim() || auth.event.place,
    {
      approvalStatus: "pending",
    }
  );

  const wasActive = auth.event.status === "active" && auth.event.published;
  const wasPreviouslyApproved =
    Boolean(auth.event.firstApprovedAt) || wasActive || auth.event.hasPendingChanges;

  await prisma.event.update({
    where: { id: eventId },
    data: {
      price: seatingLayoutIsFree(body.layout) ? "رایگان" : EVENT_PRICE_PER_SEAT_LABEL,
      ...(wasPreviouslyApproved
        ? {
            published: false,
            status: "pending",
            hasPendingChanges: true,
            pendingVenueChanges: true,
            pendingChangesAt: new Date(),
            listOnBilitmallApproved: false,
          }
        : {}),
    },
  });

  return NextResponse.json({
    success: true,
    hasSeatingPlan: true,
    message: wasPreviouslyApproved
      ? "نقشه سالن ذخیره شد و برای تأیید مجدد ادمین در انتظار است. پس از بررسی اطلاع‌رسانی می‌شود."
      : "نقشه سالن ذخیره شد و برای تأیید ادمین به بخش «سالن‌های برگزارکننده» ارسال شد. پس از تأیید، این سالن برای شهر شما در فهرست مکان‌های پیشنهادی قرار می‌گیرد.",
  });
}
