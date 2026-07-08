import type { EventDay } from "@/lib/events/types";
import { normalizeDateString, normalizeTimeString, toLatinDigits } from "@/lib/events/date-utils";
import {
  extractH1,
  extractMetaContent,
  extractTitleTag,
  stripHtmlTags,
} from "../html-utils";
import { inferCategory } from "../map-category";
import { resolveCity } from "../map-city";
import { extractMinPriceToman, extractTimes, parsePersianDateFromText } from "../persian-parse";
import type { ParsedEventPartial } from "../types";

function cleanHonarticketTitle(raw: string): string {
  return raw
    .replace(/^هنرتیکت\s*\|/i, "")
    .replace(/خرید\s*(اینترنتی\s*)?بلیت\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

const VENUE_HINT =
  /سالن|تئاتر|سینما|تماشا|برج|مجموعه|تالار|فرهنگسرا|استاد|ایوان|کاخ|پردیس/i;

function stripCityPrefixFromVenue(text: string): string {
  const commaParts = text
    .split(/[،,]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (commaParts.length >= 2) {
    const venuePart = commaParts.find((part) => VENUE_HINT.test(part));
    if (venuePart) return venuePart;
    return commaParts[commaParts.length - 1];
  }

  return text.trim();
}

function extractVenueNameOnly(raw: string): string {
  let text = raw.trim();
  if (!text) return "";

  const dashParts = text.split(/\s+[-–—]\s+/).map((part) => part.trim()).filter(Boolean);
  if (dashParts.length >= 2) {
    const last = dashParts[dashParts.length - 1];
    const before = dashParts.slice(0, -1).join(" - ");
    const cityPrefix = before.split(/[،,]/)[0]?.trim();

    if (
      last === cityPrefix ||
      (!VENUE_HINT.test(last) && before.length > last.length)
    ) {
      text = before;
    } else {
      const withKeyword = dashParts.find((part) => VENUE_HINT.test(part));
      if (withKeyword) return stripCityPrefixFromVenue(withKeyword);
      return stripCityPrefixFromVenue(last);
    }
  }

  return stripCityPrefixFromVenue(text);
}

function extractHonarticketVenue(html: string): string {
  const structured = html.match(
    /class=["']location-value["'][^>]*>([\s\S]*?)<span class=["']location-address["']/i
  );
  if (structured?.[1]) {
    return extractVenueNameOnly(stripHtmlTags(structured[1]));
  }

  const plain = stripHtmlTags(html);
  const pipeVenue = plain.match(
    /(?:تا\s+\d{1,2}\s+\S+\s+)?\d{1,2}:\d{2}[^|]*\|\s*([^نشانی]+?)(?=نشانی:|تلفن:|قیمت|$)/i
  );
  if (pipeVenue?.[1]) {
    return extractVenueNameOnly(pipeVenue[1].trim());
  }

  return "";
}

function extractHonarticketAddress(html: string): string | undefined {
  const labeled = html.match(/<label>\s*نشانی\s*:\s*<\/label>\s*([^<]+)/i);
  if (labeled?.[1]) {
    return stripHtmlTags(labeled[1]).trim().slice(0, 400) || undefined;
  }

  const plain = stripHtmlTags(html);
  const plainMatch = plain.match(/نشانی\s*:\s*([^]+?)(?=تلفن\s*:|قیمت|قوانین|$)/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim().slice(0, 400) || undefined;
  }

  return undefined;
}

function normalizeHonarticketDataDate(value: string): string | null {
  const latin = toLatinDigits(value).trim();
  const dashed = latin.match(/(14\d{2})-(\d{1,2})-(\d{1,2})/);
  if (dashed) {
    return normalizeDateString(
      `${dashed[1]}/${dashed[2].padStart(2, "0")}/${dashed[3].padStart(2, "0")}`
    );
  }
  return parsePersianDateFromText(latin);
}

function addSession(byDate: Map<string, Set<string>>, date: string, time: string) {
  if (!date || !time) return;
  const normalizedDate = normalizeDateString(date);
  const normalizedTime = normalizeTimeString(time);
  if (!normalizedDate || !normalizedTime) return;

  if (!byDate.has(normalizedDate)) byDate.set(normalizedDate, new Set());
  byDate.get(normalizedDate)!.add(normalizedTime);
}

function parseHonarticketInstancesFromAnchors(html: string, purchaseUrl: string): EventDay[] {
  const byDate = new Map<string, Set<string>>();
  const anchorRegex =
    /<a(?=[^>]*\bdata-date=["'](\d{4}-\d{2}-\d{2})["'])(?=[^>]*\bclass=["'][^"']*\binstance\b)[^>]*>([\s\S]*?)<\/a>/gi;

  let match: RegExpExecArray | null;
  while ((match = anchorRegex.exec(html)) !== null) {
    const date = normalizeHonarticketDataDate(match[1]);
    const block = match[2];
    const timeMatch = block.match(
      /class=["']instance-time["'][^>]*>\s*([0-9۰-۹]{1,2}:[0-9۰-۹]{2})/i
    );
    if (!date || !timeMatch?.[1]) continue;
    addSession(byDate, date, timeMatch[1]);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([date, times]) => ({
      date,
      sessions: [...times]
        .sort()
        .map((time) => ({ time, purchaseUrl })),
    }));
}

function parseHonarticketInstancesFromSelect(html: string, purchaseUrl: string): EventDay[] {
  const byDate = new Map<string, Set<string>>();
  const selectMatch = html.match(
    /<select[^>]*class=["'][^"']*session[^"']*["'][^>]*>([\s\S]*?)<\/select>/i
  );
  if (!selectMatch?.[1]) return [];

  const optionRegex = /<option[^>]*>([^<]+)<\/option>/gi;
  let match: RegExpExecArray | null;
  while ((match = optionRegex.exec(selectMatch[1])) !== null) {
    const text = stripHtmlTags(match[1]);
    const date = parsePersianDateFromText(text);
    const times = extractTimes(text);
    if (!date || times.length === 0) continue;
    for (const time of times) addSession(byDate, date, time);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([date, times]) => ({
      date,
      sessions: [...times]
        .sort()
        .map((time) => ({ time, purchaseUrl })),
    }));
}

function parseHonarticketSessionLines(html: string, purchaseUrl: string): EventDay[] {
  const byDate = new Map<string, Set<string>>();
  const plainText = stripHtmlTags(html);

  const lineRegex =
    /((?:شنبه|یکشنبه|یک‌شنبه|دوشنبه|سه‌شنبه|سه شنبه|چهارشنبه|پنجشنبه|جمعه)[^|]+\|[^]+?)(?=\n|نشانی|قیمت|$)/gi;

  let match: RegExpExecArray | null;
  while ((match = lineRegex.exec(plainText)) !== null) {
    const line = match[1];
    const date = parsePersianDateFromText(line);
    const times = extractTimes(line);
    if (!date || times.length === 0) continue;
    for (const time of times) addSession(byDate, date, time);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([date, times]) => ({
      date,
      sessions: [...times]
        .sort()
        .map((time) => ({ time, purchaseUrl })),
    }));
}

function parseHonarticketDays(html: string, purchaseUrl: string): EventDay[] {
  const fromAnchors = parseHonarticketInstancesFromAnchors(html, purchaseUrl);
  if (fromAnchors.length > 0) return fromAnchors;

  const fromSelect = parseHonarticketInstancesFromSelect(html, purchaseUrl);
  if (fromSelect.length > 0) return fromSelect;

  return parseHonarticketSessionLines(html, purchaseUrl);
}

export function parseHonarticketPage(html: string, sourceUrl: string): ParsedEventPartial {
  const ogTitle = extractMetaContent(html, "og:title");
  const titleTag = extractTitleTag(html);
  const h1 = extractH1(html);
  const rawTitle = ogTitle ?? h1 ?? titleTag ?? "";
  const title = cleanHonarticketTitle(rawTitle);

  const imageUrl = extractMetaContent(html, "og:image");
  const plainText = stripHtmlTags(html);

  const place = extractHonarticketVenue(html);
  const placeAddress = extractHonarticketAddress(html);
  const days = parseHonarticketDays(html, sourceUrl);

  const cityResult = resolveCity(
    `${placeAddress ?? ""} ${title} ${place}`
  );
  const categoryResult = inferCategory(`${title} ${plainText.slice(0, 500)}`);
  const price = extractMinPriceToman(plainText);

  return {
    title: title || undefined,
    city: cityResult.city,
    cityCandidates: cityResult.candidates,
    category: categoryResult.category,
    categoryCandidates: categoryResult.candidates,
    place: place || undefined,
    placeAddress,
    price: price ?? undefined,
    imageUrl,
    days: days.length > 0 ? days : undefined,
  };
}
