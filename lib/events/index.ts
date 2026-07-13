import { seedEvents } from "./seed-events";
import {
  countEvents,
  countFeaturedEvents,
  deleteEvent,
  getEventRecordById,
  isSlugTaken,
  normalizeAllStoredEventDays,
  saveManagedEvent,
  upsertSeedEvent,
} from "./store";
import type { EventDay, EventFormData, EventItem, ManagedEvent } from "./types";
import { resolveTicketingType } from "./types";
import {
  enrichEventStatus,
  isEventEnded,
  managedToEventItem,
  normalizeEventDays,
  slugify,
} from "./date-utils";
import { isAdminListableEvent, MAX_FEATURED_EVENTS } from "./helpers";
import { runAdminEventMaintenance } from "./maintenance";
import { MY_EVENT_EVENT_SOURCE } from "@/lib/my-event/constants";
import { resolveEventPlaceAddress } from "./venue";
import { resolveFormPrice } from "./pricing";
import { syncEventSeatingFromVenueTemplate } from "@/lib/seating/store";

export {
  POPULAR_CATEGORY_SLUG,
  MAX_FEATURED_EVENTS,
  matchesEventCategory,
  getPopularEventsFromList,
  getFeaturedEventsFromList,
  getEventUrl,
  hasUploadedImage,
} from "./helpers";
export {
  EVENT_STATUS_LABELS,
  getEventStatusLabel,
  isEventUnavailable,
  resolveEventStatus,
} from "./status";
export type { EventDay, EventFormData, EventItem, EventSession, ManagedEvent, TicketingType } from "./types";
export { EVENT_CATEGORY_EVENT, resolveTicketingType } from "./types";
export { getEventSchedule, getUpcomingEventSchedule, normalizeDateString, normalizeEventDays, formatEventDateDisplay, formatPersianDateLong } from "./date-utils";

function parseDays(raw: string): EventDay[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function dbRecordToManagedEvent(record: {
  id: number;
  slug: string;
  title: string;
  city: string;
  category: string;
  place: string;
  placeAddress?: string | null;
  venueTemplateId?: number | null;
  price: string;
  image: string;
  bannerImage?: string | null;
  badge: string | null;
  days: string;
  published: boolean;
  popular: boolean;
  featured: boolean;
  ticketingType: string;
  hasAssignedSeating?: boolean;
  status: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  venueTemplate?: { address: string } | null;
}): ManagedEvent & { source: "seed" | "managed" | "my_event" } {
  const source =
    record.source === MY_EVENT_EVENT_SOURCE
      ? "my_event"
      : (record.source as "seed" | "managed");

  const placeAddress =
    record.placeAddress?.trim() || record.venueTemplate?.address?.trim() || undefined;

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    city: record.city,
    category: record.category,
    place: record.place,
    placeAddress,
    venueTemplateId: record.venueTemplateId ?? null,
    price: record.price,
    image: record.image,
    bannerImage: record.bannerImage?.trim() || "",
    badge: record.badge ?? undefined,
    days: parseDays(record.days),
    published: record.published,
    popular: record.popular,
    featured: record.featured,
    ticketingType: record.ticketingType as ManagedEvent["ticketingType"],
    hasAssignedSeating: record.hasAssignedSeating === true,
    status: record.status as ManagedEvent["status"],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    source,
  };
}

type DbEventRecord = Parameters<typeof dbRecordToManagedEvent>[0] & {
  publicEventSlug?: string | null;
  publicCitySlug?: string | null;
  listOnBilitmallApproved?: boolean;
  myEventOrganizer?: { slug: string } | null;
};

function toPublicEventItem(record: DbEventRecord): EventItem {
  const item = enrichEventStatus(managedToEventItem(dbRecordToManagedEvent(record)));

  return {
    ...item,
    myEventOrganizerSlug: record.myEventOrganizer?.slug,
    publicEventSlug: record.publicEventSlug ?? undefined,
    publicCitySlug: record.publicCitySlug ?? undefined,
    listOnBilitmallApproved: record.listOnBilitmallApproved,
    venueTemplateId: record.venueTemplateId ?? undefined,
  };
}

async function ensureUniqueSlug(base: string, excludeId?: number): Promise<string> {
  let slug = slugify(base);
  if (!slug) slug = "event";

  let candidate = slug;
  let counter = 1;

  while (await isSlugTaken(candidate, excludeId)) {
    candidate = `${slug}-${counter}`;
    counter += 1;
  }

  return candidate;
}

async function ensureSeedData(): Promise<void> {
  await normalizeAllStoredEventDays();

  const total = await countEvents();
  if (total > 0) return;

  for (const seed of seedEvents) {
    const days =
      seed.days ??
      (seed.date && seed.time
        ? [{ date: seed.date, sessions: [{ time: seed.time }] }]
        : []);

    await upsertSeedEvent({
      id: seed.id,
      slug: seed.slug,
      title: seed.title,
      city: seed.city,
      category: seed.category,
      place: seed.place,
      price: seed.price,
      image: seed.image,
      bannerImage: "",
      badge: seed.badge,
      days,
      published: true,
      popular: seed.popular ?? false,
      featured: seed.featured ?? false,
      ticketingType: seed.ticketingType ?? resolveTicketingType(seed.category),
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

function isVisibleOnBilitmallMarketplace(record: {
  source: string;
  published: boolean;
  status: string;
  listOnBilitmallApproved: boolean;
}): boolean {
  if (record.source === MY_EVENT_EVENT_SOURCE) {
    return (
      record.published &&
      record.status === "active" &&
      record.listOnBilitmallApproved
    );
  }
  return record.published;
}

export async function getAllEvents(options?: {
  includeUnpublished?: boolean;
  includeEnded?: boolean;
}): Promise<EventItem[]> {
  await ensureSeedData();

  const { prisma } = await import("@/lib/prisma");
  const records = await prisma.event.findMany({
    orderBy: { id: "asc" },
    include: {
      myEventOrganizer: { select: { slug: true } },
      venueTemplate: { select: { address: true } },
    },
  });

  return records
    .filter((record) => options?.includeUnpublished || isVisibleOnBilitmallMarketplace(record))
    .map((record) => toPublicEventItem(record))
    .filter((event) => options?.includeEnded || !isEventEnded(event));
}

export async function getEventById(id: number): Promise<EventItem | undefined> {
  await ensureSeedData();

  const record = await getEventRecordById(id);
  if (!record) return undefined;

  const { prisma } = await import("@/lib/prisma");
  const dbRecord = await prisma.event.findUnique({
    where: { id },
    include: {
      myEventOrganizer: { select: { slug: true } },
      venueTemplate: { select: { address: true } },
    },
  });
  if (!dbRecord) return undefined;

  return toPublicEventItem(dbRecord);
}

export async function getEventBySlug(
  slug: string,
  options?: { includeEnded?: boolean; includeUnpublished?: boolean }
): Promise<EventItem | undefined> {
  await ensureSeedData();

  const { prisma } = await import("@/lib/prisma");
  const record = await prisma.event.findUnique({
    where: { slug },
    include: {
      myEventOrganizer: { select: { slug: true } },
      venueTemplate: { select: { address: true } },
    },
  });
  if (!record) return undefined;

  const event = toPublicEventItem(record);
  if (!options?.includeUnpublished && !isVisibleOnBilitmallMarketplace(record)) return undefined;
  if (event.published === false && !options?.includeUnpublished) return undefined;
  if (!options?.includeEnded && isEventEnded(event)) return undefined;

  return event;
}

async function assertFeaturedLimit(
  featured: boolean,
  city: string,
  excludeId?: number
): Promise<void> {
  if (!featured) return;

  const count = await countFeaturedEvents(city, excludeId);
  if (count >= MAX_FEATURED_EVENTS) {
    throw new Error(
      `حداکثر ${MAX_FEATURED_EVENTS} رویداد برای شهر «${city}» می‌تواند در پیشنهاد ویژه باشد.`
    );
  }
}

async function formToManagedEvent(
  form: EventFormData,
  existing?: ManagedEvent
): Promise<ManagedEvent> {
  const slugBase = `${form.title}-${form.city}`;
  const slug = existing
    ? await ensureUniqueSlug(slugBase, existing.id)
    : await ensureUniqueSlug(slugBase);
  const now = new Date().toISOString();
  const venueTemplateId = form.venueTemplateId ?? null;
  const placeAddress = await resolveEventPlaceAddress(venueTemplateId, form.placeAddress);

  return {
    id: existing?.id ?? 0,
    slug,
    title: form.title.trim(),
    city: form.city,
    category: form.category,
    place: form.place.trim(),
    placeAddress: placeAddress ?? undefined,
    venueTemplateId,
    price: resolveFormPrice(form),
    image: form.image,
    bannerImage: form.bannerImage,
    badge: form.badge.trim() || undefined,
    days: normalizeEventDays(form.days),
    published: form.published,
    popular: form.popular,
    featured: form.featured,
    ticketingType: form.ticketingType ?? resolveTicketingType(form.category),
    hasAssignedSeating: form.hasAssignedSeating === true,
    status: form.status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export async function createManagedEvent(form: EventFormData): Promise<EventItem> {
  await assertFeaturedLimit(form.featured, form.city);
  const managed = await formToManagedEvent(form);
  const saved = await saveManagedEvent(managed);

  if (saved.hasAssignedSeating && saved.venueTemplateId) {
    await syncEventSeatingFromVenueTemplate(saved.id, saved.venueTemplateId);
  }

  return managedToEventItem({ ...saved, source: "managed" });
}

export async function updateEvent(
  id: number,
  form: EventFormData
): Promise<EventItem | null> {
  const existing = await getEventRecordById(id);
  if (!existing) return null;

  await assertFeaturedLimit(form.featured, form.city, id);

  const { prisma } = await import("@/lib/prisma");
  const dbRecord = await prisma.event.findUnique({ where: { id } });
  if (!dbRecord) return null;

  const managed = await formToManagedEvent(form, existing);
  managed.id = id;

  const saved = await saveManagedEvent(managed, {
    preserveSource: dbRecord.source as "seed" | "managed",
  });

  if (saved.hasAssignedSeating && saved.venueTemplateId) {
    await syncEventSeatingFromVenueTemplate(saved.id, saved.venueTemplateId);
  }

  return managedToEventItem({
    ...saved,
    source: dbRecord.source as "seed" | "managed",
  });
}

export async function removeEvent(id: number): Promise<boolean> {
  return deleteEvent(id);
}

export async function removeEvents(
  ids: number[]
): Promise<{ deleted: number; notFound: number[] }> {
  const uniqueIds = [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))];
  let deleted = 0;
  const notFound: number[] = [];

  for (const id of uniqueIds) {
    if (await deleteEvent(id)) {
      deleted += 1;
    } else {
      notFound.push(id);
    }
  }

  return { deleted, notFound };
}

/** حذف دائمی رویدادهای تمام‌شده، ناقص، تکراری و بدون سانس پیش‌رو */
export async function purgeStaleAdminEvents(): Promise<{ deleted: number }> {
  const maintenance = await runAdminEventMaintenance();

  const all = await getAllEvents({ includeUnpublished: true, includeEnded: true });
  const staleIds = all
    .filter((event) => !isAdminListableEvent(event))
    .map((event) => event.id);

  let deleted = 0;
  for (const id of staleIds) {
    if (await deleteEvent(id)) deleted++;
  }

  return {
    deleted:
      deleted +
      maintenance.deletedNoUpcoming +
      maintenance.deletedDuplicates,
  };
}

/** @deprecated از purgeStaleAdminEvents استفاده کنید */
export async function purgeEndedEvents(): Promise<{ deleted: number }> {
  return purgeStaleAdminEvents();
}
