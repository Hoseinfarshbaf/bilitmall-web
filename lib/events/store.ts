import type { EventDay, ManagedEvent } from "./types";
import { resolveTicketingType } from "./types";
import { prisma } from "@/lib/prisma";
import { normalizeEventDays } from "./date-utils";

function parseDays(raw: string): EventDay[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeEventDays(parsed) : [];
  } catch {
    return [];
  }
}

function serializeDays(days: EventDay[]): string {
  return JSON.stringify(days);
}

function toManagedEvent(record: {
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
  bannerImage: string;
  badge: string | null;
  days: string;
  published: boolean;
  popular: boolean;
  featured: boolean;
  ticketingType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): ManagedEvent {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    city: record.city,
    category: record.category,
    place: record.place,
    placeAddress: record.placeAddress?.trim() || undefined,
    venueTemplateId: record.venueTemplateId ?? null,
    price: record.price,
    image: record.image,
    bannerImage: record.bannerImage ?? "",
    badge: record.badge ?? undefined,
    days: parseDays(record.days),
    published: record.published,
    popular: record.popular,
    featured: record.featured,
    ticketingType: record.ticketingType as ManagedEvent["ticketingType"],
    status: record.status as ManagedEvent["status"],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toEventData(event: ManagedEvent, source: "seed" | "managed") {
  return {
    slug: event.slug,
    title: event.title,
    city: event.city,
    category: event.category,
    place: event.place,
    placeAddress: event.placeAddress ?? null,
    venueTemplateId: event.venueTemplateId ?? null,
    price: event.price,
    image: event.image,
    bannerImage: event.bannerImage ?? "",
    badge: event.badge ?? null,
    days: serializeDays(event.days),
    published: event.published,
    popular: event.popular,
    featured: event.featured,
    ticketingType: event.ticketingType,
    status: event.status,
    source,
  };
}

export async function getEventRecordById(id: number): Promise<ManagedEvent | undefined> {
  const record = await prisma.event.findUnique({ where: { id } });
  return record ? toManagedEvent(record) : undefined;
}

export async function saveManagedEvent(
  event: ManagedEvent,
  options?: { preserveSource?: "seed" | "managed" }
): Promise<ManagedEvent> {
  const existing = event.id > 0 ? await prisma.event.findUnique({ where: { id: event.id } }) : null;
  const source = options?.preserveSource ?? existing?.source ?? "managed";
  const data = toEventData(event, source as "seed" | "managed");

  if (existing) {
    const record = await prisma.event.update({
      where: { id: event.id },
      data,
    });
    return toManagedEvent(record);
  }

  const record = await prisma.event.create({ data });
  return toManagedEvent(record);
}

export async function deleteEvent(id: number): Promise<boolean> {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return false;

  await prisma.event.delete({ where: { id } });
  return true;
}

export async function isSlugTaken(slug: string, excludeId?: number): Promise<boolean> {
  const existing = await prisma.event.findFirst({
    where: {
      slug,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
  return Boolean(existing);
}

export async function upsertSeedEvent(event: ManagedEvent): Promise<void> {
  const data = toEventData(event, "seed");

  await prisma.event.upsert({
    where: { slug: event.slug },
    create: data,
    update: data,
  });
}

export async function countEvents(): Promise<number> {
  return prisma.event.count();
}

export async function countFeaturedEvents(
  city: string,
  excludeId?: number
): Promise<number> {
  return prisma.event.count({
    where: {
      featured: true,
      city,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
}

export async function normalizeAllStoredEventDays(): Promise<void> {
  const records = await prisma.event.findMany();

  for (const record of records) {
    const normalized = serializeDays(parseDays(record.days));
    if (normalized !== record.days) {
      await prisma.event.update({
        where: { id: record.id },
        data: { days: normalized },
      });
    }
  }
}
