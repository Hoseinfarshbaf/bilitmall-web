import type { EventItem } from "./types";
import { isEventEnded } from "./date-utils";

export const EVENT_STATUSES = [
  "active",
  "held",
  "sold_out",
  "cancelled",
  "draft",
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  active: "فعال",
  held: "برگزار شد",
  sold_out: "ظرفیت تکمیل",
  cancelled: "لغو شد",
  draft: "پیش‌نویس",
};

/** برچسب ادمین برای رویدادهایی که تاریخشان گذشته است */
export const EVENT_PAST_DATE_LABEL = "تاریخ گذشته";

export type AdminEventStatusTone =
  | "active"
  | "past"
  | "sold_out"
  | "cancelled"
  | "draft";

const ADMIN_STATUS_STYLES: Record<AdminEventStatusTone, string> = {
  active: "bg-green-100 text-green-700",
  past: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
  sold_out: "bg-orange-100 text-orange-700",
  cancelled: "bg-red-100 text-red-700",
  draft: "bg-amber-100 text-amber-700",
};

const LEGACY_STATUS_MAP: Record<string, EventStatus> = {
  "تاریخ گذشته": "held",
  "تموم شده": "held",
  "لغو شده": "cancelled",
  "ظرفیت تکمیل": "sold_out",
};

export function normalizeStoredStatus(status?: string | null): EventStatus {
  if (!status) return "active";
  if (status in EVENT_STATUS_LABELS) return status as EventStatus;
  return LEGACY_STATUS_MAP[status] ?? "active";
}

export function resolveEventStatus(
  event: Pick<EventItem, "status" | "published" | "date" | "time" | "days">
): EventStatus {
  if (event.published === false) return "draft";

  const stored = normalizeStoredStatus(event.status);

  if (stored === "cancelled" || stored === "sold_out" || stored === "held") {
    return stored;
  }

  if (isEventEnded(event)) {
    return "held";
  }

  return "active";
}

export function getEventStatusLabel(
  event: Pick<EventItem, "status" | "published" | "date" | "time" | "days" | "isEnded">
): string {
  return EVENT_STATUS_LABELS[resolveEventStatus(event)];
}

export function getAdminEventStatusDisplay(
  event: Pick<
    EventItem,
    "status" | "published" | "date" | "time" | "days" | "storedStatus"
  >
): { label: string; tone: AdminEventStatusTone; className: string } {
  if (event.published === false) {
    return {
      label: EVENT_STATUS_LABELS.draft,
      tone: "draft",
      className: ADMIN_STATUS_STYLES.draft,
    };
  }

  const stored = normalizeStoredStatus(event.storedStatus ?? event.status);

  if (stored === "cancelled") {
    return {
      label: EVENT_STATUS_LABELS.cancelled,
      tone: "cancelled",
      className: ADMIN_STATUS_STYLES.cancelled,
    };
  }

  if (stored === "sold_out") {
    return {
      label: EVENT_STATUS_LABELS.sold_out,
      tone: "sold_out",
      className: ADMIN_STATUS_STYLES.sold_out,
    };
  }

  if (isEventEnded(event)) {
    return {
      label: EVENT_PAST_DATE_LABEL,
      tone: "past",
      className: ADMIN_STATUS_STYLES.past,
    };
  }

  return {
    label: EVENT_STATUS_LABELS.active,
    tone: "active",
    className: ADMIN_STATUS_STYLES.active,
  };
}

export function isEventUnavailable(
  event: Pick<EventItem, "status" | "published" | "date" | "time" | "days" | "isEnded">
): boolean {
  const status = resolveEventStatus(event);
  return status === "held" || status === "cancelled" || status === "sold_out";
}
