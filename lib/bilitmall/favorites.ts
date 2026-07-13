import { getEventById } from "@/lib/events";
import type { EventItem } from "@/lib/events/types";
import { prisma } from "@/lib/prisma";

export async function getUserFavoriteEventIds(userId: number): Promise<number[]> {
  const rows = await prisma.favoriteEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { eventId: true },
  });

  return rows.map((row) => row.eventId);
}

export async function getUserFavoriteEvents(userId: number): Promise<EventItem[]> {
  const favorites = await prisma.favoriteEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { eventId: true },
  });

  const events: EventItem[] = [];
  for (const favorite of favorites) {
    const event = await getEventById(favorite.eventId);
    if (event) events.push(event);
  }

  return events;
}

export async function addUserFavorite(
  userId: number,
  eventId: number
): Promise<{ added: boolean }> {
  const event = await getEventById(eventId);
  if (!event) {
    throw new Error("رویداد یافت نشد.");
  }

  await prisma.favoriteEvent.upsert({
    where: {
      userId_eventId: { userId, eventId },
    },
    create: { userId, eventId },
    update: {},
  });

  return { added: true };
}

export async function removeUserFavorite(
  userId: number,
  eventId: number
): Promise<{ removed: boolean }> {
  const result = await prisma.favoriteEvent.deleteMany({
    where: { userId, eventId },
  });

  return { removed: result.count > 0 };
}

export async function isUserFavorite(userId: number, eventId: number): Promise<boolean> {
  const row = await prisma.favoriteEvent.findUnique({
    where: {
      userId_eventId: { userId, eventId },
    },
    select: { id: true },
  });

  return Boolean(row);
}
