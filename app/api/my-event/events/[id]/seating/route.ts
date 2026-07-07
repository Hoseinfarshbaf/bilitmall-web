import { NextResponse } from "next/server";
import { getMyEventSession } from "@/lib/my-event/session";
import { getMyEventOrganizerEvent, getSessionMyEventOrganizer } from "@/lib/my-event/store";
import { isMyEventEventApproved, MY_EVENT_LINKED_VENUE_SEATING_HINT } from "@/lib/my-event/constants";
import {
  getEventSeatingPlan,
  resolveInitialEventSeatingLayout,
  saveEventSeatingPlan,
} from "@/lib/seating/store";
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

  if (auth.event.venueTemplateId) {
    return NextResponse.json(
      { error: MY_EVENT_LINKED_VENUE_SEATING_HINT },
      { status: 403 }
    );
  }

  if (!isMyEventEventApproved(auth.event)) {
    return NextResponse.json(
      { error: "طراحی صحنه پس از تأیید رویداد توسط ادمین فعال می‌شود." },
      { status: 403 }
    );
  }

  const existing = await getEventSeatingPlan(eventId);
  const layout = await resolveInitialEventSeatingLayout(eventId, {
    place: auth.event.place,
    title: auth.event.title,
    venueTemplateId: auth.event.venueTemplateId,
  });

  return NextResponse.json({
    eventId,
    eventTitle: auth.event.title,
    hasSeatingPlan: Boolean(existing),
    layout,
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

  if (!isMyEventEventApproved(auth.event)) {
    return NextResponse.json(
      { error: "طراحی صحنه پس از تأیید رویداد توسط ادمین فعال می‌شود." },
      { status: 403 }
    );
  }

  const body = (await request.json()) as { layout?: SeatingLayout };
  if (!body.layout) {
    return NextResponse.json({ error: "نقشه سالن ارسال نشده." }, { status: 400 });
  }

  await saveEventSeatingPlan(eventId, body.layout, body.layout.name, {
    approvalStatus: "pending",
  });
  return NextResponse.json({ success: true, hasSeatingPlan: true });
}
