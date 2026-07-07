import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify, normalizeEventDays } from "@/lib/events/date-utils";
import { MY_EVENT_EVENT_SOURCE, MY_EVENT_EVENT_SUBMIT_SUCCESS_MESSAGE } from "@/lib/my-event/constants";
import { isValidMyEventCategory } from "@/lib/my-event/categories";
import { resolveTicketingType } from "@/lib/events/types";
import { getMyEventSession } from "@/lib/my-event/session";
import {
  getMyEventOrganizerEvents,
  getSessionMyEventOrganizer,
  assignUniquePublicSlugs,
} from "@/lib/my-event/store";

import {
  getVenueTemplateById,
  syncEventSeatingFromVenueTemplate,
} from "@/lib/seating/store";

async function resolveEventPlaceAddress(
  venueTemplateId: number | null | undefined,
  placeAddress?: string
): Promise<string | null> {
  const trimmed = placeAddress?.trim();
  if (trimmed) return trimmed;
  if (!venueTemplateId) return null;
  const template = await getVenueTemplateById(venueTemplateId);
  return template?.address?.trim() || null;
}

export async function GET() {
  const session = await getMyEventSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getSessionMyEventOrganizer(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await getMyEventOrganizerEvents(user.myEventOrganizerId);
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const session = await getMyEventSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getSessionMyEventOrganizer(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.myEventOrganizer.status === "suspended") {
    return NextResponse.json({ error: "حساب مسدود است." }, { status: 403 });
  }

  if (user.myEventOrganizer.status !== "active") {
    return NextResponse.json(
      {
        error:
          "حساب شما هنوز توسط ادمین تأیید نشده است. پس از تأیید می‌توانید رویداد ثبت کنید.",
      },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    title?: string;
    city?: string;
    category?: string;
    place?: string;
    placeAddress?: string;
    price?: string;
    description?: string;
    image?: string;
    days?: { date: string; sessions: { time: string; purchaseUrl?: string }[] }[];
    hasAssignedSeating?: boolean;
    listOnBilitmall?: boolean;
    publicEventSlug?: string;
    venueTemplateId?: number | null;
    published?: boolean;
  };

  const title = body.title?.trim() ?? "";
  const city = body.city?.trim() ?? "تهران";
  const category = body.category?.trim() ?? "ایونت";
  const place = body.place?.trim() ?? "";
  const price = body.price?.trim() ?? "";
  const image = body.image?.trim() ?? "";

  if (!isValidMyEventCategory(category)) {
    return NextResponse.json({ error: "دسته‌بندی را انتخاب کنید." }, { status: 400 });
  }

  if (!title || !place || !price) {
    return NextResponse.json(
      { error: "عنوان، مکان و قیمت الزامی است." },
      { status: 400 }
    );
  }

  const days = normalizeEventDays(body.days ?? []);
  if (days.length === 0) {
    return NextResponse.json(
      { error: "بازه تاریخ و حداقل یک سانس الزامی است." },
      { status: 400 }
    );
  }

  if (!image) {
    return NextResponse.json({ error: "تصویر رویداد الزامی است." }, { status: 400 });
  }

  let slugBase = slugify(`${title}-${user.myEventOrganizer.slug}`);
  if (!slugBase) slugBase = `event-${Date.now()}`;

  let slug = slugBase;
  let counter = 1;
  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${counter}`;
    counter += 1;
  }

  const { publicEventSlug, publicCitySlug } = await assignUniquePublicSlugs(
    user.myEventOrganizerId,
    title,
    city,
    { requestedSlug: body.publicEventSlug }
  );

  const venueTemplateId = body.venueTemplateId ?? null;
  const placeAddress = await resolveEventPlaceAddress(venueTemplateId, body.placeAddress);

  const event = await prisma.event.create({
    data: {
      slug,
      title,
      city,
      category,
      place,
      placeAddress,
      price,
      description: body.description?.trim() || null,
      image,
      publicEventSlug,
      publicCitySlug,
      days: JSON.stringify(days),
      published: false,
      ticketingType: resolveTicketingType(category),
      hasAssignedSeating: body.hasAssignedSeating === true,
      listOnBilitmallRequested: body.listOnBilitmall === true,
      source: MY_EVENT_EVENT_SOURCE,
      myEventOrganizerId: user.myEventOrganizerId,
      venueTemplateId,
      status: "pending",
    },
  });

  if (event.hasAssignedSeating && venueTemplateId) {
    await syncEventSeatingFromVenueTemplate(event.id, venueTemplateId);
  }

  return NextResponse.json(
    {
      id: event.id,
      slug: event.slug,
      status: event.status,
      message: MY_EVENT_EVENT_SUBMIT_SUCCESS_MESSAGE,
    },
    { status: 201 }
  );
}
