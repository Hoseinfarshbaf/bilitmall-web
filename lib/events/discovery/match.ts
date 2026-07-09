import { getEventSchedule } from "@/lib/events/date-utils";
import type { EventItem } from "@/lib/events/types";
import type { DiscoveredCatalogItem, DiscoveredEventRow, DiscoveryProviderId } from "./types";
import { externalPathKey, normalizeExternalUrl } from "./url";

export type RegisteredEventIndex = {
  purchaseUrls: Set<string>;
  pathKeys: Set<string>;
  titleCityPlace: Set<string>;
  titleCity: Set<string>;
};

function normalizeMatchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[|·،,]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "");
}

function titleCityPlaceKey(title: string, city: string, place: string): string {
  return `${normalizeMatchText(title)}|${normalizeMatchText(city)}|${normalizeMatchText(place)}`;
}

function titleCityKey(title: string, city: string): string {
  return `${normalizeMatchText(title)}|${normalizeMatchText(city)}`;
}

export function buildRegisteredEventIndex(events: EventItem[]): RegisteredEventIndex {
  const purchaseUrls = new Set<string>();
  const pathKeys = new Set<string>();
  const titleCityPlace = new Set<string>();
  const titleCity = new Set<string>();

  for (const event of events) {
    titleCityPlace.add(titleCityPlaceKey(event.title, event.city, event.place));
    titleCity.add(titleCityKey(event.title, event.city));

    const schedule = getEventSchedule(event);
    for (const day of schedule) {
      for (const session of day.sessions) {
        if (!session.purchaseUrl?.trim()) continue;
        const normalized = normalizeExternalUrl(session.purchaseUrl);
        purchaseUrls.add(normalized);
        pathKeys.add(externalPathKey(session.purchaseUrl));
      }
    }
  }

  return { purchaseUrls, pathKeys, titleCityPlace, titleCity };
}

export function matchDiscoveredEvent(
  item: DiscoveredCatalogItem,
  provider: DiscoveryProviderId,
  index: RegisteredEventIndex,
  events: EventItem[]
): Pick<DiscoveredEventRow, "registrationStatus" | "matchedEventId" | "matchedEventTitle" | "matchReason"> {
  const normalizedUrl = normalizeExternalUrl(item.url);
  const pathKey = externalPathKey(item.url);

  if (index.purchaseUrls.has(normalizedUrl) || index.pathKeys.has(pathKey)) {
    const matched = events.find((event) => {
      const schedule = getEventSchedule(event);
      return schedule.some((day) =>
        day.sessions.some((session) => {
          if (!session.purchaseUrl) return false;
          return (
            normalizeExternalUrl(session.purchaseUrl) === normalizedUrl ||
            externalPathKey(session.purchaseUrl) === pathKey
          );
        })
      );
    });
    return {
      registrationStatus: "registered",
      matchedEventId: matched?.id,
      matchedEventTitle: matched?.title,
      matchReason: "لینک خرید در سانس‌های ثبت‌شده",
    };
  }

  const city = item.city ?? "";
  const place = item.place ?? "";
  const tcpKey = titleCityPlaceKey(item.title, city, place);
  if (place && index.titleCityPlace.has(tcpKey)) {
    const matched = events.find(
      (e) => titleCityPlaceKey(e.title, e.city, e.place) === tcpKey
    );
    return {
      registrationStatus: "registered",
      matchedEventId: matched?.id,
      matchedEventTitle: matched?.title,
      matchReason: "عنوان + شهر + مکان",
    };
  }

  const tcKey = titleCityKey(item.title, city);
  if (city && index.titleCity.has(tcKey)) {
    const matched = events.find((e) => titleCityKey(e.title, e.city) === tcKey);
    return {
      registrationStatus: "registered",
      matchedEventId: matched?.id,
      matchedEventTitle: matched?.title,
      matchReason: "عنوان + شهر",
    };
  }

  void provider;
  return { registrationStatus: "unregistered" };
}

export function attachMatchResults(
  items: DiscoveredCatalogItem[],
  provider: DiscoveryProviderId,
  events: EventItem[]
): DiscoveredEventRow[] {
  const index = buildRegisteredEventIndex(events);
  return items.map((item) => ({
    ...item,
    provider,
    ...matchDiscoveredEvent(item, provider, index, events),
  }));
}
