import type { EventDay } from "@/lib/events/types";
import { toLatinDigits } from "@/lib/events/date-utils";
import { extractMetaContent, stripHtmlTags } from "../html-utils";
import { inferCategory } from "../map-category";
import { resolveCity } from "../map-city";
import { extractTimes, parsePersianDateFromText } from "../persian-parse";
import type { ParsedEventPartial } from "../types";

function parseMelotikSessions(plainText: string, purchaseUrl: string): EventDay[] {
  const days: EventDay[] = [];
  const dayMap = new Map<string, EventDay>();

  const blocks = plainText.split(/(?=ساعت\s)/i);
  for (const block of blocks) {
    const timeMatch = block.match(/ساعت\s*([\d۰-۹]{1,2}:[\d۰-۹]{2})/i);
    if (!timeMatch) continue;

    const time = extractTimes(timeMatch[1])[0];
    if (!time) continue;

    const contextStart = Math.max(0, plainText.indexOf(block) - 120);
    const context = plainText.slice(contextStart, plainText.indexOf(block) + block.length);
    const date = parsePersianDateFromText(context);
    if (!date) continue;

    const venueMatch = context.match(
      /(?:هتل|سالن|تالار|فضای باز|مجموعه|استادیوم|برج)[^\n،,|]+/i
    );
    const venue = venueMatch?.[0]?.trim();

    const existing = dayMap.get(date);
    if (existing) {
      if (!existing.sessions.some((s) => s.time === time)) {
        existing.sessions.push({ time, purchaseUrl });
      }
    } else {
      dayMap.set(date, {
        date,
        sessions: [{ time, purchaseUrl }],
      });
    }

    if (venue && !days.find((d) => d.date === date)) {
      // venue stored at partial level
    }
  }

  return [...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function parseMelotikPage(html: string, sourceUrl: string): ParsedEventPartial {
  const ogTitle = extractMetaContent(html, "og:title");
  const plainText = stripHtmlTags(html);

  const headingMatch = plainText.match(/##\s*(.+)/) ?? plainText.match(/#\s*(کنسرت[^\n]+)/i);
  const title = (ogTitle ?? headingMatch?.[1] ?? "")
    .replace(/\s*-\s*ملوتیک\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const imageUrl = extractMetaContent(html, "og:image");

  const venueMatch =
    plainText.match(/(?:هتل|سالن|تالار|فضای باز|مجموعه)[^\n]+/i) ??
    plainText.match(/\d{1,2}\s+\S+\s+140\d\s+([^\n]+)/);

  const place = venueMatch?.[0]?.trim() ?? venueMatch?.[1]?.trim();
  const days = parseMelotikSessions(plainText, sourceUrl);

  const dateLineMatch = plainText.match(/(\d{1,2}\s+\S+\s+140\d)/);
  const cityText = `${place ?? ""} ${title} ${dateLineMatch?.[0] ?? ""}`;
  const cityResult = resolveCity(cityText);
  const categoryResult = inferCategory(`${title} ${plainText.slice(0, 400)}`);

  const priceMatch = toLatinDigits(plainText).match(/(\d{1,3}(?:,\d{3})+)\s*تومان/);
  const price = priceMatch
    ? `${Number(priceMatch[1].replace(/,/g, "")).toLocaleString("fa-IR")} تومان`
    : undefined;

  return {
    title: title || undefined,
    city: cityResult.city,
    cityCandidates: cityResult.candidates,
    category: categoryResult.category,
    categoryCandidates: categoryResult.candidates,
    place: place || undefined,
    price,
    imageUrl,
    days: days.length > 0 ? days : undefined,
  };
}
