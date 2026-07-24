import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEventDays, parseDaysFromRecord } from "@/lib/events/date-utils";
import { isValidMyEventCategory } from "@/lib/my-event/categories";
import { getMyEventSession } from "@/lib/my-event/session";
import {
  deleteMyEventOrganizerEvent,
  getMyEventOrganizerEvent,
  getSessionMyEventOrganizer,
  assignUniquePublicSlugs,
} from "@/lib/my-event/store";
import { normalizePublicEventSlug } from "@/lib/my-event/public-slugs";
import {
  resolveMyEventSubmittedPrice,
  validateMyEventPricing,
} from "@/lib/events/pricing";
import {
  getEventSeatingPlan,
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

type RouteContext = { params: Promise<{ id: string }> };

async function authorizeOrganizerEvent(eventId: number) {
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
  const auth = await authorizeOrganizerEvent(eventId);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = parseDaysFromRecord(auth.event.days);
  const firstDay = days[0];
  const firstSession = firstDay?.sessions[0];

  return NextResponse.json({
    id: auth.event.id,
    slug: auth.event.slug,
    title: auth.event.title,
    city: auth.event.city,
    category: auth.event.category,
    place: auth.event.place,
    placeAddress: auth.event.placeAddress ?? "",
    venueTemplateId: auth.event.venueTemplateId,
    price: auth.event.price,
    description: auth.event.description,
    image: auth.event.image,
    hasAssignedSeating: auth.event.hasAssignedSeating,
    hasSeatingPlan:
      Boolean(await getEventSeatingPlan(eventId)) || auth.event.venueTemplateId != null,
    listOnBilitmall: auth.event.listOnBilitmallRequested,
    publicEventSlug: auth.event.publicEventSlug ?? "",
    status: auth.event.status,
    published: auth.event.published,
    days,
    date: firstDay?.date ?? "",
    time: firstSession?.time ?? "20:00",
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const eventId = Number((await context.params).id);
  const auth = await authorizeOrganizerEvent(eventId);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    pricingMode?: "free" | "fixed" | "per_seat" | null;
    fixedPriceAmount?: string;
    listOnBilitmall?: boolean;
    publicEventSlug?: string;
    venueTemplateId?: number | null;
  };

  const title = body.title?.trim();
  const city = body.city?.trim();
  const category = body.category?.trim();
  const place = body.place?.trim();

  if (category && !isValidMyEventCategory(category)) {
    return NextResponse.json({ error: "دسته‌بندی نامعتبر است." }, { status: 400 });
  }

  const nextHasAssignedSeating =
    body.hasAssignedSeating !== undefined
      ? body.hasAssignedSeating
      : auth.event.hasAssignedSeating;
  const pricingTouched =
    body.hasAssignedSeating !== undefined ||
    body.pricingMode !== undefined ||
    body.fixedPriceAmount !== undefined;

  if (pricingTouched) {
    const pricingError = validateMyEventPricing({
      hasAssignedSeating: nextHasAssignedSeating,
      pricingMode: body.pricingMode ?? null,
      fixedPriceAmount: body.fixedPriceAmount,
    });
    if (pricingError) {
      return NextResponse.json({ error: pricingError }, { status: 400 });
    }
  }

  const resolvedPrice = pricingTouched
    ? resolveMyEventSubmittedPrice({
        hasAssignedSeating: nextHasAssignedSeating,
        pricingMode: body.pricingMode,
        fixedPriceAmount: body.fixedPriceAmount,
      })
    : undefined;

  const days =
    body.days && body.days.length > 0
      ? normalizeEventDays(body.days)
      : parseDaysFromRecord(auth.event.days);

  if (days.length === 0) {
    return NextResponse.json(
      { error: "بازه تاریخ و حداقل یک سانس الزامی است." },
      { status: 400 }
    );
  }

  const wasActive = auth.event.status === "active" && auth.event.published;
  const wasPreviouslyApproved =
    Boolean(auth.event.firstApprovedAt) || wasActive || auth.event.hasPendingChanges;
  const listingChanged =
    body.listOnBilitmall !== undefined &&
    body.listOnBilitmall !== auth.event.listOnBilitmallRequested;

  const nextTitle = title ?? auth.event.title;
  const nextCity = city ?? auth.event.city;
  const slugInputChanged =
    body.publicEventSlug !== undefined &&
    normalizePublicEventSlug(body.publicEventSlug) !==
      (auth.event.publicEventSlug ?? "");
  const titleChanged = Boolean(title && title !== auth.event.title);

  const needsSlugRefresh = slugInputChanged || (titleChanged && !auth.event.publicEventSlug);

  let publicEventSlug = auth.event.publicEventSlug;
  let publicCitySlug = auth.event.publicCitySlug;

  if (needsSlugRefresh) {
    const slugs = await assignUniquePublicSlugs(
      auth.user.myEventOrganizerId,
      nextTitle,
      nextCity,
      {
        excludeEventId: eventId,
        requestedSlug: body.publicEventSlug ?? auth.event.publicEventSlug ?? undefined,
      }
    );
    publicEventSlug = slugs.publicEventSlug;
    publicCitySlug = slugs.publicCitySlug;
  }

  const nextVenueTemplateId =
    body.venueTemplateId !== undefined ? body.venueTemplateId : auth.event.venueTemplateId;
  const shouldResolveAddress =
    body.placeAddress !== undefined || body.venueTemplateId !== undefined;
  const resolvedPlaceAddress = shouldResolveAddress
    ? await resolveEventPlaceAddress(
        nextVenueTemplateId,
        body.placeAddress !== undefined ? body.placeAddress : auth.event.placeAddress ?? undefined
      )
    : undefined;

  const finalPlaceAddress =
    resolvedPlaceAddress !== undefined
      ? resolvedPlaceAddress
      : auth.event.placeAddress;
  if (!nextVenueTemplateId && !(finalPlaceAddress ?? "").trim()) {
    return NextResponse.json(
      { error: "برای محل اجرای سفارشی، آدرس دقیق الزامی است." },
      { status: 400 }
    );
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(title ? { title } : {}),
      ...(city ? { city } : {}),
      ...(category ? { category } : {}),
      // برگزارکننده My Event همیشه فروش داخلی بلیت‌مال است (نه لینک خارجی).
      ticketingType: "INTERNAL",
      ...(place ? { place } : {}),
      ...(resolvedPlaceAddress !== undefined ? { placeAddress: resolvedPlaceAddress } : {}),
      ...(body.venueTemplateId !== undefined
        ? { venueTemplateId: body.venueTemplateId }
        : {}),
      ...(body.hasAssignedSeating !== undefined
        ? { hasAssignedSeating: body.hasAssignedSeating }
        : {}),
      ...(resolvedPrice !== undefined ? { price: resolvedPrice } : {}),
      ...(body.description !== undefined
        ? { description: body.description.trim() || null }
        : {}),
      ...(body.image !== undefined ? { image: body.image.trim() } : {}),
      ...(body.listOnBilitmall !== undefined
        ? {
            listOnBilitmallRequested: body.listOnBilitmall,
            listOnBilitmallApproved: listingChanged ? false : auth.event.listOnBilitmallApproved,
          }
        : {}),
      ...(needsSlugRefresh
        ? { publicEventSlug, publicCitySlug }
        : {}),
      days: JSON.stringify(days),
      ...(wasPreviouslyApproved
        ? {
            published: false,
            status: "pending",
            hasPendingChanges: true,
            pendingEventChanges: true,
            pendingChangesAt: new Date(),
            listOnBilitmallApproved: false,
          }
        : {}),
    },
  });

  if (updated.hasAssignedSeating && updated.venueTemplateId) {
    await syncEventSeatingFromVenueTemplate(updated.id, updated.venueTemplateId);
  }

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    hasPendingChanges: updated.hasPendingChanges,
    pendingEventChanges: updated.pendingEventChanges,
    pendingVenueChanges: updated.pendingVenueChanges,
    message: wasPreviouslyApproved
      ? "تغییرات ذخیره شد. پس از بررسی، از طریق پیامک به شما اطلاع داده می‌شود."
      : "تغییرات ذخیره شد.",
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const eventId = Number((await context.params).id);
  const auth = await authorizeOrganizerEvent(eventId);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteMyEventOrganizerEvent(auth.user.myEventOrganizerId, eventId);
  return NextResponse.json({ success: true });
}
