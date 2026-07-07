import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import type { EventDay, EventItem, ManagedEvent } from "./types";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toLatinDigits(value: string): string {
  return value
    .split("")
    .map((char) => {
      const persianIndex = PERSIAN_DIGITS.indexOf(char);
      if (persianIndex >= 0) return String(persianIndex);
      const arabicIndex = ARABIC_DIGITS.indexOf(char);
      if (arabicIndex >= 0) return String(arabicIndex);
      return char;
    })
    .join("");
}

export function normalizeDateString(date: string): string {
  const latin = toLatinDigits(date.trim());
  const parts = latin.replace(/-/g, "/").split("/").filter(Boolean);

  if (parts.length !== 3) return latin;

  const [year, month, day] = parts;
  return `${year}/${month.padStart(2, "0")}/${day.padStart(2, "0")}`;
}

export function normalizeTimeString(time: string): string {
  const latin = toLatinDigits(time.trim());
  const match = latin.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return latin;

  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function normalizeEventDays(days: EventDay[]): EventDay[] {
  return days.map((day) => ({
    date: normalizeDateString(day.date),
    sessions: day.sessions.map((session) => ({
      time: normalizeTimeString(session.time),
      purchaseUrl: session.purchaseUrl?.trim() || undefined,
    })),
  }));
}

export function parseDaysFromRecord(raw: string): EventDay[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeEventDays(parsed) : [];
  } catch {
    return [];
  }
}

function toPersianDateObject(date: string): DateObject {
  return new DateObject({
    date: normalizeDateString(date),
    format: "YYYY/MM/DD",
    calendar: persian,
    locale: persian_fa,
  });
}

export function formatPersianDateLong(date: string): string {
  return toPersianDateObject(date).format("D MMMM YYYY");
}

export function formatPersianDateShort(date: string): string {
  return toPersianDateObject(date).format("D MMMM");
}

export function formatEventDateDisplay(
  event: Pick<EventItem, "date" | "time" | "days">
): string {
  const schedule = getEventSchedule(event);
  if (schedule.length === 0) {
    return event.date ? formatPersianDateLong(event.date) : "";
  }

  if (schedule.length === 1) {
    return formatPersianDateLong(schedule[0].date);
  }

  const first = schedule[0].date;
  const last = schedule[schedule.length - 1].date;
  const firstObj = toPersianDateObject(first);
  const lastObj = toPersianDateObject(last);

  if (firstObj.year === lastObj.year) {
    return `${formatPersianDateShort(first)} تا ${formatPersianDateShort(last)}`;
  }

  return `${formatPersianDateLong(first)} تا ${formatPersianDateLong(last)}`;
}

export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .slice(0, 60);
}

export function parsePersianDateTime(date: string, time: string): Date {
  const normalizedDate = normalizeDateString(date);
  const normalizedTime = normalizeTimeString(time);
  const [hours = 0, minutes = 0] = normalizedTime.split(":").map(Number);
  const dateObject = new DateObject({
    date: normalizedDate,
    format: "YYYY/MM/DD",
    calendar: persian,
  });

  const jsDate = dateObject.toDate();
  jsDate.setHours(hours, minutes, 0, 0);
  return jsDate;
}

export function getEventSchedule(event: Pick<EventItem, "date" | "time" | "days">): EventDay[] {
  if (event.days && event.days.length > 0) {
    return normalizeEventDays(event.days);
  }

  if (event.date && event.time) {
    return normalizeEventDays([{ date: event.date, sessions: [{ time: event.time }] }]);
  }

  return [];
}

export function getPrimaryDateTime(event: Pick<EventItem, "date" | "time" | "days">): {
  date: string;
  time: string;
} {
  const schedule = getEventSchedule(event);
  const now = new Date();

  for (const day of schedule) {
    for (const session of day.sessions) {
      const sessionDate = parsePersianDateTime(day.date, session.time);
      if (sessionDate >= now) {
        return { date: day.date, time: session.time };
      }
    }
  }

  const lastDay = schedule[schedule.length - 1];
  const lastSession = lastDay?.sessions[lastDay.sessions.length - 1];

  return {
    date: lastDay?.date ?? event.date,
    time: lastSession?.time ?? event.time,
  };
}

export function isEventEnded(event: Pick<EventItem, "date" | "time" | "days">): boolean {
  const schedule = getEventSchedule(event);
  if (schedule.length === 0) return false;

  const now = new Date();
  let hasSession = false;

  for (const day of schedule) {
    for (const session of day.sessions) {
      hasSession = true;
      const sessionDate = parsePersianDateTime(day.date, session.time);
      if (sessionDate >= now) {
        return false;
      }
    }
  }

  return hasSession;
}

/** فقط سانس‌هایی که هنوز برگزار نشده‌اند */
export function getUpcomingEventSchedule(
  event: Pick<EventItem, "date" | "time" | "days">
): EventDay[] {
  const now = new Date();
  const schedule = getEventSchedule(event);
  const upcoming: EventDay[] = [];

  for (const day of schedule) {
    const sessions = day.sessions.filter(
      (session) => parsePersianDateTime(day.date, session.time) >= now
    );
    if (sessions.length > 0) {
      upcoming.push({ date: day.date, sessions });
    }
  }

  return upcoming;
}

/** تعداد روز مانده تا یک تاریخ شمسی (۰ = امروز، منفی = گذشته) */
export function getDaysUntilDate(date: string): number {
  const normalized = normalizeDateString(date);
  const target = new DateObject({
    date: normalized,
    format: "YYYY/MM/DD",
    calendar: persian,
  }).toDate();
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** برچسب فارسی «روز مانده به اجرا» */
export function formatDaysUntilLabel(date: string): string {
  const days = getDaysUntilDate(date);
  if (days < 0) return "برگزار شده";
  if (days === 0) return "امروز";
  if (days === 1) return "فردا";
  return `${days.toLocaleString("fa-IR")} روز مانده`;
}

export function eventMatchesDateFilter(
  event: Pick<EventItem, "date" | "time" | "days">,
  dateFilter: string | null | undefined
): boolean {
  if (!dateFilter?.trim()) return true;

  const target = normalizeDateString(dateFilter);
  const schedule = getEventSchedule(event);

  return schedule.some((day) => normalizeDateString(day.date) === target);
}

export function enrichEventStatus<T extends EventItem>(event: T): T {
  const storedStatus = event.status ?? "active";
  const ended = isEventEnded(event);
  return {
    ...event,
    storedStatus,
    isEnded: ended,
    status:
      storedStatus === "cancelled" || storedStatus === "sold_out"
        ? storedStatus
        : ended
          ? "held"
          : storedStatus,
  };
}

export function managedToEventItem(
  event: ManagedEvent & { source?: "seed" | "managed" | "my_event" }
): EventItem {
  const primary = getPrimaryDateTime({ date: "", time: "", days: event.days });

  return enrichEventStatus({
    id: event.id,
    slug: event.slug,
    title: event.title,
    city: event.city,
    category: event.category,
    date: primary.date,
    time: primary.time,
    place: event.place,
    placeAddress: event.placeAddress,
    venueTemplateId: event.venueTemplateId,
    price: event.price,
    image: event.image,
    badge: event.badge,
    days: event.days,
    published: event.published,
    popular: event.popular,
    featured: event.featured,
    ticketingType: event.ticketingType,
    hasAssignedSeating: event.hasAssignedSeating,
    status: event.status,
    source: event.source ?? "managed",
  });
}

export function seedToEventItem(
  event: Omit<EventItem, "source" | "isEnded" | "published">
): EventItem {
  return enrichEventStatus({
    ...event,
    published: true,
    source: "seed",
  });
}
