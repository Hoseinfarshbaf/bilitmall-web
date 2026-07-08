import type { EventDay, EventSession } from "@/lib/events/types";
import { normalizeEventDays } from "@/lib/events/date-utils";
import {
  extractH1,
  extractJsonLd,
  extractMetaContent,
  extractNextData,
  extractScriptJsonBlobs,
  extractTitleTag,
  findDeepValues,
  stripHtmlTags,
} from "../html-utils";
import { inferCategory } from "../map-category";
import { resolveCity } from "../map-city";
import { extractMinPriceToman, extractTimes, parsePersianDateFromText } from "../persian-parse";
import type { ParsedEventPartial } from "../types";

function eventFromJsonLd(items: Record<string, unknown>[]): ParsedEventPartial | null {
  const event = items.find(
    (item) =>
      item["@type"] === "Event" ||
      item["@type"] === "MusicEvent" ||
      item["@type"] === "TheaterEvent"
  );
  if (!event) return null;

  const title = typeof event.name === "string" ? event.name : undefined;
  const image =
    typeof event.image === "string"
      ? event.image
      : Array.isArray(event.image) && typeof event.image[0] === "string"
        ? event.image[0]
        : undefined;

  const location = event.location as Record<string, unknown> | undefined;
  const place =
    location && typeof location.name === "string" ? location.name : undefined;
  const placeAddress =
    location && typeof location.address === "string"
      ? location.address
      : location &&
          typeof location.address === "object" &&
          location.address &&
          typeof (location.address as Record<string, unknown>).streetAddress === "string"
        ? String((location.address as Record<string, unknown>).streetAddress)
        : undefined;

  const startDate = typeof event.startDate === "string" ? event.startDate : undefined;
  const days: EventDay[] = [];
  if (startDate) {
    const date = parsePersianDateFromText(startDate) ?? startDate.slice(0, 10);
    const time = extractTimes(startDate)[0] ?? "20:00";
    days.push({ date, sessions: [{ time }] });
  }

  const offers = event.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
  let price: string | undefined;
  if (offers) {
    const offer = Array.isArray(offers) ? offers[0] : offers;
    if (offer && typeof offer.price === "string") price = offer.price;
    if (offer && typeof offer.price === "number") {
      price = `${offer.price.toLocaleString("fa-IR")} تومان`;
    }
  }

  return { title, imageUrl: image, place, placeAddress, price, days: days.length ? days : undefined };
}

function sessionsFromDeepJson(blobs: unknown[], purchaseUrl: string): EventDay[] {
  const days: EventDay[] = [];
  for (const blob of blobs) {
    const dateValues = findDeepValues(blob, ["date", "eventDate", "showDate", "jalaliDate"]);
    const timeValues = findDeepValues(blob, ["time", "showTime", "startTime", "hour"]);
    for (const dv of dateValues) {
      if (typeof dv !== "string") continue;
      const date = parsePersianDateFromText(dv);
      if (!date) continue;
      const times = timeValues.flatMap((tv) =>
        typeof tv === "string" ? extractTimes(tv) : []
      );
      const sessions: EventSession[] = (times.length ? times : ["20:00"]).map((time) => ({
        time,
        purchaseUrl,
      }));
      days.push({ date, sessions });
    }
  }
  return normalizeEventDays(days);
}

export function parseGenericPage(html: string, sourceUrl: string): ParsedEventPartial {
  const jsonLd = extractJsonLd(html);
  const fromLd = eventFromJsonLd(jsonLd);

  const ogTitle = extractMetaContent(html, "og:title");
  const title =
    fromLd?.title ??
    extractH1(html) ??
    ogTitle ??
    extractTitleTag(html) ??
    undefined;

  const imageUrl = fromLd?.imageUrl ?? extractMetaContent(html, "og:image");
  const plainText = stripHtmlTags(html);

  const nextData = extractNextData(html);
  const scriptBlobs = extractScriptJsonBlobs(html);
  const allBlobs = [nextData, ...scriptBlobs].filter(Boolean);

  let days = fromLd?.days ?? sessionsFromDeepJson(allBlobs, sourceUrl);
  if (days.length === 0) {
    const date = parsePersianDateFromText(plainText);
    const times = extractTimes(plainText);
    if (date && times.length > 0) {
      days = [{ date, sessions: times.map((time) => ({ time, purchaseUrl: sourceUrl })) }];
    }
  }

  const place = fromLd?.place;
  const placeAddress = fromLd?.placeAddress;
  const cityResult = resolveCity(`${title ?? ""} ${place ?? ""} ${placeAddress ?? ""} ${plainText.slice(0, 300)}`);
  const categoryResult = inferCategory(`${title ?? ""} ${plainText.slice(0, 500)}`);
  const price = fromLd?.price ?? extractMinPriceToman(plainText) ?? undefined;

  return {
    title,
    city: cityResult.city,
    cityCandidates: cityResult.candidates,
    category: categoryResult.category,
    categoryCandidates: categoryResult.candidates,
    place,
    placeAddress,
    price,
    imageUrl,
    days: days.length > 0 ? days : undefined,
  };
}
