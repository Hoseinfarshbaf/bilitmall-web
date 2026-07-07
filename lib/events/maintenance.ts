import { prisma } from "@/lib/prisma";
import {
  getUpcomingEventSchedule,
  normalizeEventDays,
} from "./date-utils";
import type { EventDay } from "./types";
import { deleteEvent } from "./store";

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

function duplicateEventKey(title: string, city: string, place: string): string {
  return `${title.trim()}|${city.trim()}|${place.trim()}`;
}

/** حذف سانس‌های گذشته از دیتابیس؛ رویداد بدون سانس پیش‌رو حذف می‌شود */
export async function prunePastEventDaysFromDatabase(): Promise<{
  pruned: number;
  deleted: number;
}> {
  const records = await prisma.event.findMany({ orderBy: { id: "asc" } });
  let pruned = 0;
  let deleted = 0;

  for (const record of records) {
    const days = parseDays(record.days);
    const upcoming = getUpcomingEventSchedule({ date: "", time: "", days });

    if (upcoming.length === 0) {
      await deleteEvent(record.id);
      deleted++;
      continue;
    }

    const nextDays = serializeDays(upcoming);
    if (nextDays !== record.days) {
      await prisma.event.update({
        where: { id: record.id },
        data: { days: nextDays },
      });
      pruned++;
    }
  }

  return { pruned, deleted };
}

/** حذف رکوردهای تکراری (همان عنوان + شهر + مکان) — قدیمی‌ترین نگه داشته می‌شود */
export async function purgeDuplicateEvents(): Promise<{ deleted: number }> {
  const records = await prisma.event.findMany({ orderBy: { id: "asc" } });
  const seen = new Map<string, number>();
  let deleted = 0;

  for (const record of records) {
    const key = duplicateEventKey(record.title, record.city, record.place);
    if (seen.has(key)) {
      await deleteEvent(record.id);
      deleted++;
      continue;
    }
    seen.set(key, record.id);
  }

  return { deleted };
}

export async function runAdminEventMaintenance(): Promise<{
  prunedDays: number;
  deletedNoUpcoming: number;
  deletedDuplicates: number;
}> {
  const { pruned, deleted: deletedNoUpcoming } = await prunePastEventDaysFromDatabase();
  const { deleted: deletedDuplicates } = await purgeDuplicateEvents();

  return {
    prunedDays: pruned,
    deletedNoUpcoming,
    deletedDuplicates,
  };
}
