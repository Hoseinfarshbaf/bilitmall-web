export type EventSession = {
  time: string;
  purchaseUrl?: string;
};

export type EventDay = {
  date: string;
  sessions: EventSession[];
};

export type EventStatusValue = "active" | "held" | "sold_out" | "cancelled" | "draft";

export type TicketingType = "EXTERNAL_LINK" | "INTERNAL";

export const EVENT_CATEGORY_EVENT = "ایونت";

export function resolveTicketingType(category: string): TicketingType {
  return category === EVENT_CATEGORY_EVENT ? "INTERNAL" : "EXTERNAL_LINK";
}

export type EventItem = {
  id: number;
  slug: string;
  title: string;
  city: string;
  category: string;
  date: string;
  time: string;
  place: string;
  placeAddress?: string;
  venueTemplateId?: number | null;
  price: string;
  image: string;
  bannerImage?: string;
  badge?: string;
  days?: EventDay[];
  published?: boolean;
  popular?: boolean;
  featured?: boolean;
  ticketingType?: TicketingType;
  hasAssignedSeating?: boolean;
  status?: EventStatusValue;
  storedStatus?: EventStatusValue;
  source?: "seed" | "managed" | "my_event";
  myEventOrganizerSlug?: string;
  publicEventSlug?: string;
  publicCitySlug?: string;
  listOnBilitmallApproved?: boolean;
  isEnded?: boolean;
};

export type ManagedEvent = {
  id: number;
  slug: string;
  title: string;
  city: string;
  category: string;
  place: string;
  placeAddress?: string;
  venueTemplateId?: number | null;
  price: string;
  image: string;
  bannerImage: string;
  badge?: string;
  days: EventDay[];
  published: boolean;
  popular: boolean;
  featured: boolean;
  ticketingType: TicketingType;
  hasAssignedSeating?: boolean;
  status: EventStatusValue;
  createdAt: string;
  updatedAt: string;
};

export type EventFormData = {
  title: string;
  city: string;
  category: string;
  place: string;
  placeAddress?: string;
  venueTemplateId?: number | null;
  price: string;
  image: string;
  bannerImage: string;
  badge: string;
  days: EventDay[];
  published: boolean;
  popular: boolean;
  featured: boolean;
  status: EventStatusValue;
};

import { DEFAULT_CITY_NAMES } from "@/lib/cities/constants";

/** @deprecated Use useCities() or getCityNames() from @/lib/cities */
export const ALL_CITIES = DEFAULT_CITY_NAMES;

export const EVENT_CATEGORIES = ["کنسرت", "تئاتر", "ایونت"] as const;

export const EVENT_PLACEHOLDER_IMAGE = "/images/placeholder-event.svg";

export const ADMIN_EVENT_STATUSES = [
  { value: "active", label: "فعال" },
  { value: "sold_out", label: "ظرفیت تکمیل" },
  { value: "cancelled", label: "لغو شد" },
] as const;
