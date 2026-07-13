import { getEventSchedule } from "@/lib/events/date-utils";
import { isExternalTicketing } from "@/lib/events/pricing";
import type { EventItem } from "@/lib/events/types";

export type EventOwnershipType = "bilitmall" | "linked" | "organizer";

export type ExternalTicketSiteId = "honarticket" | "tiwall" | "other";

export const OWNERSHIP_LABELS: Record<EventOwnershipType, string> = {
  bilitmall: "بلیت‌مال",
  linked: "لینک شده",
  organizer: "برگزارکننده",
};

export const EXTERNAL_SITE_LABELS: Record<ExternalTicketSiteId, string> = {
  honarticket: "هنر تیکت",
  tiwall: "تیوال",
  other: "سایت دیگر",
};

export type EventOriginInfo = {
  ownership: EventOwnershipType;
  externalSite: ExternalTicketSiteId | null;
  label: string;
  detail?: string;
};

export type OwnershipFilter = "همه" | EventOwnershipType;
export type SiteFilter = "همه" | "bilitmall" | ExternalTicketSiteId;

function collectPurchaseUrls(event: EventItem): string[] {
  const urls: string[] = [];
  for (const day of getEventSchedule(event)) {
    for (const session of day.sessions) {
      const url = session.purchaseUrl?.trim();
      if (url) urls.push(url);
    }
  }
  return urls;
}

function hasExternalPurchaseUrl(event: EventItem): boolean {
  return collectPurchaseUrls(event).length > 0;
}

function detectExternalSiteFromUrl(url: string): ExternalTicketSiteId | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("honarticket")) return "honarticket";
    if (host.includes("tiwall")) return "tiwall";
    return "other";
  } catch {
    return null;
  }
}

export function resolveExternalTicketSite(event: EventItem): ExternalTicketSiteId | null {
  const urls = collectPurchaseUrls(event);
  if (urls.length === 0) return null;

  const sites = urls
    .map(detectExternalSiteFromUrl)
    .filter((site): site is ExternalTicketSiteId => site !== null);

  if (sites.length === 0) return "other";
  if (sites.some((site) => site === "honarticket")) return "honarticket";
  if (sites.some((site) => site === "tiwall")) return "tiwall";
  return "other";
}

export function resolveEventOwnership(event: EventItem): EventOwnershipType {
  if (event.source === "my_event") return "organizer";
  if (isExternalTicketing(event.ticketingType) || hasExternalPurchaseUrl(event)) {
    return "linked";
  }
  return "bilitmall";
}

export function resolveEventOrigin(event: EventItem): EventOriginInfo {
  const ownership = resolveEventOwnership(event);
  const externalSite =
    ownership === "linked" ? resolveExternalTicketSite(event) : null;

  if (ownership === "organizer") {
    const organizer = event.myEventOrganizerSlug?.trim();
    return {
      ownership,
      externalSite: null,
      label: OWNERSHIP_LABELS.organizer,
      detail: organizer ? `صفحه ${organizer}` : undefined,
    };
  }

  if (ownership === "linked") {
    const siteLabel = externalSite ? EXTERNAL_SITE_LABELS[externalSite] : "سایت خارجی";
    return {
      ownership,
      externalSite,
      label: `${OWNERSHIP_LABELS.linked} · ${siteLabel}`,
      detail: externalSite ? EXTERNAL_SITE_LABELS[externalSite] : undefined,
    };
  }

  return {
    ownership,
    externalSite: null,
    label: OWNERSHIP_LABELS.bilitmall,
  };
}

export function eventMatchesOwnershipFilter(
  event: EventItem,
  filter: OwnershipFilter
): boolean {
  if (filter === "همه") return true;
  return resolveEventOwnership(event) === filter;
}

export function eventMatchesSiteFilter(event: EventItem, filter: SiteFilter): boolean {
  if (filter === "همه") return true;

  const ownership = resolveEventOwnership(event);
  if (filter === "bilitmall") return ownership === "bilitmall";

  if (ownership !== "linked") return false;
  return resolveExternalTicketSite(event) === filter;
}
