import type { CSSProperties } from "react";
import type { EventItem } from "./types";
import { EVENT_PLACEHOLDER_IMAGE } from "./types";
import { getEventSchedule, getUpcomingEventSchedule, isEventEnded } from "./date-utils";
import { getMyEventPublicUrl } from "@/lib/my-event/domains";
import { MY_EVENT_EVENT_SOURCE } from "@/lib/my-event/constants";
import { buildPublicEventSlug } from "@/lib/my-event/public-slugs";

export const POPULAR_CATEGORY_SLUG = "محبوب";
export const MAX_FEATURED_EVENTS = 4;

export function matchesEventCategory(
  eventCategory: string,
  categorySlug: string
): boolean {
  const slug = categorySlug.trim();
  if (slug === "همه") return true;
  return eventCategory === slug;
}

/** مسیر صفحه لیست رویدادها بر اساس شهر و دسته */
export function buildDiscoveryPageUrl(city: string, category: string): string {
  return `/events/${encodeURIComponent(city.trim())}/${encodeURIComponent(category.trim())}`;
}

export function getDiscoveryCategorySlug(
  variant: "upcoming" | "popular",
  category?: string,
  categoryLabel?: string
): string {
  if (variant === "popular") return POPULAR_CATEGORY_SLUG;
  return category ?? categoryLabel ?? "همه";
}

export function getEventUrl(
  event: Pick<
    EventItem,
    | "city"
    | "category"
    | "slug"
    | "source"
    | "myEventOrganizerSlug"
    | "publicEventSlug"
    | "publicCitySlug"
    | "title"
  >
): string {
  if (
    event.source === MY_EVENT_EVENT_SOURCE &&
    event.myEventOrganizerSlug
  ) {
    const publicEventSlug =
      event.publicEventSlug ?? buildPublicEventSlug(event.title ?? event.slug);
    return getMyEventPublicUrl(event.myEventOrganizerSlug, publicEventSlug);
  }

  const city = encodeURIComponent(event.city);
  const category = encodeURIComponent(event.category);
  const slug = encodeURIComponent(event.slug);
  return `/events/${city}/${category}/${slug}`;
}

export function getCityEventsFromList(allEvents: EventItem[], city: string): EventItem[] {
  return allEvents.filter(
    (event) =>
      event.published !== false &&
      event.city === city.trim() &&
      !isEventEnded(event)
  );
}

export function getPopularEventsFromList(allEvents: EventItem[], city: string): EventItem[] {
  return getCityEventsFromList(allEvents, city).filter((event) => event.popular === true);
}

export function getFeaturedEventsFromList(
  allEvents: EventItem[],
  city: string
): EventItem[] {
  return getCityEventsFromList(allEvents, city)
    .filter((event) => Boolean(event.featured))
    .slice(0, MAX_FEATURED_EVENTS);
}

export function isWellFormedEvent(
  event: Pick<EventItem, "title" | "place" | "city" | "days" | "date" | "time">
): boolean {
  if (!event.title?.trim() || !event.place?.trim() || !event.city?.trim()) {
    return false;
  }
  return getUpcomingEventSchedule(event).length > 0;
}

export function isAdminListableEvent(event: EventItem): boolean {
  return isWellFormedEvent(event) && !isEventEnded(event);
}

export function getEventImageUrl(image?: string | null): string {
  if (!image?.trim()) return EVENT_PLACEHOLDER_IMAGE;
  return image;
}

export function getEventImageStyle(image?: string | null): CSSProperties {
  const url = getEventImageUrl(image);

  return {
    backgroundImage: `url(${url})`,
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundColor: "#171717",
  };
}

export function getEventBannerImageStyle(image?: string | null): CSSProperties {
  const url = getEventImageUrl(image);

  return {
    backgroundImage: `url(${url})`,
    backgroundSize: "cover",
    backgroundPosition: "center 32%",
    backgroundColor: "#171717",
  };
}

export function hasUploadedImage(image?: string | null): boolean {
  return Boolean(image?.trim().startsWith("/uploads/"));
}
