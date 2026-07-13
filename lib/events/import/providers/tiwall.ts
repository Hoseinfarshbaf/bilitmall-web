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
import {
  extractMinPriceToman,
  extractTimes,
  parsePersianDateFromText,
} from "../persian-parse";
import type { ParsedEventPartial } from "../types";

function cleanTiwallTitle(raw: string): string {
  return raw
    .replace(/^تیوال\s*(?:[|›>:،,-]\s*)?/i, "")
    .replace(/\s*[|›>]\s*تیوال.*$/i, "")
    .replace(/^خرید\s*(?:اینترنتی\s*)?بلیت\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTiwallCity(
  html: string,
  place: string,
  placeAddress: string | undefined,
  cityNames: string[]
): { city?: string; candidates: string[] } {
  const citySection = html.match(/<h6>\s*شهر\s*<\/h6>([\s\S]*?)(?:<\/div>|<div)/i);
  if (citySection?.[1]) {
    const taggedCities = [...citySection[1].matchAll(/title=["']([^"']+)["']/gi)]
      .map((match) => match[1].trim())
      .filter((name) => cityNames.includes(name));
    const uniqueTagged = [...new Set(taggedCities)];
    if (uniqueTagged.length === 1) {
      return { city: uniqueTagged[0], candidates: uniqueTagged };
    }
    if (uniqueTagged.length > 1) {
      return { candidates: uniqueTagged };
    }
  }

  return resolveCity(`${placeAddress ?? ""} ${place}`, cityNames);
}

function resolveTiwallUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

function extractAttr(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`${name}=["']([^"']+)["']`, "i"));
  return match?.[1];
}

function extractJsonLdVenue(html: string): string | undefined {
  const ldMatch = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (!ldMatch?.[1]) return undefined;

  try {
    const data = JSON.parse(ldMatch[1]) as { location?: { name?: string } };
    const name = data.location?.name?.trim();
    if (name && name.length > 2) return name;
  } catch {
    // ignore malformed JSON-LD
  }

  return undefined;
}

function extractTiwallVenue(html: string): string {
  const venueTitle = html.match(/<div\s+class=["']venue["'][^>]*title=["']([^"']+)["']/i);
  if (venueTitle?.[1]) {
    const value = stripHtmlTags(venueTitle[1]).replace(/\s+/g, " ").trim();
    if (value.length > 2 && value.length < 120) return value;
  }

  const venueSpan = html.match(/<div\s+class=["']venue["'][\s\S]*?<span>([\s\S]*?)<\/span>/i);
  if (venueSpan?.[1]) {
    const value = stripHtmlTags(venueSpan[1]).replace(/\s+/g, " ").trim();
    if (value.length > 2 && value.length < 120) return value;
  }

  const jsonLdVenue = extractJsonLdVenue(html);
  if (jsonLdVenue) return jsonLdVenue;

  const ogDescription = extractMetaContent(html, "og:description");
  if (ogDescription) {
    const venueFromOg = ogDescription.match(/بلیت\s+[^،]+،\s*([^،]+)،\s*کارگردان/i);
    if (venueFromOg?.[1]) {
      const value = venueFromOg[1].replace(/\s+/g, " ").trim();
      if (value.length > 2 && value.length < 120) return value;
    }
  }

  return "";
}

export function extractTiwallSaleUrl(html: string, sourceUrl: string): string | undefined {
  const patterns = [
    /<a[^>]*class=["'][^"']*\bbtn\b[^"']*\bbuy\b[^"']*["'][^>]*href=["']([^"']+)["']/i,
    /<a[^>]*href=["']([^"']+)["'][^>]*class=["'][^"']*\bbtn\b[^"']*\bbuy\b[^"']*["']/i,
    /"offers"\s*:\s*\{[\s\S]*?"url"\s*:\s*"([^"]+)"/i,
    /data-saleurn=["'](\/s\/[^"']+)["']/i,
    /href=["'](\/s\/[^"'?#]+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;
    const href = match[1].replace(/\\\//g, "/");
    if (!href.includes("/s/")) continue;
    return resolveTiwallUrl(href, sourceUrl);
  }

  return undefined;
}

export function extractTiwallAddress(html: string): string | undefined {
  const patterns = [
    /نشانی\s*[:：]\s*<\/label>\s*([^<]+)/i,
    /نشانی\s*[:：]\s*([^<\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const value = stripHtmlTags(match[1]).trim().slice(0, 400);
      if (value.length > 8) return value;
    }
  }

  return undefined;
}

function buildPurchaseUrl(saleUrl: string, instanceId?: string): string {
  if (!instanceId) return saleUrl;
  const url = new URL(saleUrl);
  url.searchParams.set("instance_id", instanceId);
  return url.toString();
}

export function parseTiwallSessionsFromSaleHtml(
  saleHtml: string,
  saleUrl: string
): EventDay[] {
  const byDate = new Map<string, Map<string, string>>();

  const instanceTagRegex = /<a\b[^>]*\bclass=["'][^"']*\binstance\b[^"']*["'][^>]*>/gi;
  let tagMatch: RegExpExecArray | null;

  while ((tagMatch = instanceTagRegex.exec(saleHtml)) !== null) {
    const tag = tagMatch[0];
    const dataDate = extractAttr(tag, "data-date");
    const dataId = extractAttr(tag, "data-id");
    if (!dataDate || !dataId) continue;

    const afterTag = saleHtml.slice(tagMatch.index + tag.length, tagMatch.index + tag.length + 700);
    const titleMatch = afterTag.match(
      /instance-title[^>]*>[\s\S]*?›\s*([\d۰-۹]{1,2}:[\d۰-۹]{2})/i
    );
    const time = titleMatch
      ? normalizeTimeString(extractTimes(titleMatch[1])[0])
      : "";
    if (!time) continue;

    const date = normalizeDateString(dataDate);
    if (!byDate.has(date)) byDate.set(date, new Map());
    byDate.get(date)!.set(time, dataId);
  }

  if (byDate.size === 0) {
    const optionRegex =
      /<option[^>]*value=["'](\d+)["'][^>]*>([\s\S]*?)<\/option>/gi;
    let optionMatch: RegExpExecArray | null;

    while ((optionMatch = optionRegex.exec(saleHtml)) !== null) {
      const dataId = optionMatch[1];
      const label = stripHtmlTags(optionMatch[2]).replace(/\s+/g, " ").trim();
      const time = normalizeTimeString(extractTimes(label)[0]);
      const date = parsePersianDateFromText(label);
      if (!date || !time) continue;

      const normalizedDate = normalizeDateString(date);
      if (!byDate.has(normalizedDate)) byDate.set(normalizedDate, new Map());
      byDate.get(normalizedDate)!.set(time, dataId);
    }
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([date, sessionsByTime]) => ({
      date,
      sessions: [...sessionsByTime.entries()]
        .sort(([a], [b]) => a.localeCompare(b, "en"))
        .map(([time, instanceId]) => ({
          time,
          purchaseUrl: buildPurchaseUrl(saleUrl, instanceId),
        })),
    }));
}

function parseTiwallSessions(plainText: string, purchaseUrl: string): EventDay[] {
  const byDate = new Map<string, Set<string>>();

  const rangeRegex =
    /(?:از\s+)?(\d{1,2}\s+\S+(?:\s+تا\s+\d{1,2}\s+\S+)?(?:\s+۱۴۰۵)?)[^\d]*((?:\d{1,2}:\d{2}(?:\s+و\s+\d{1,2}:\d{2})?))/g;

  let match: RegExpExecArray | null;
  while ((match = rangeRegex.exec(plainText)) !== null) {
    const date = parsePersianDateFromText(match[1]);
    const times = extractTimes(match[2]);
    if (!date || times.length === 0) continue;
    if (!byDate.has(date)) byDate.set(date, new Set());
    for (const time of times) {
      byDate.get(date)!.add(normalizeTimeString(time));
    }
  }

  const singleDateRegex = /(\d{1,2}\s+\S+(?:\s+۱۴۰۵)?)\s+(\d{1,2}:\d{2})/g;
  while ((match = singleDateRegex.exec(plainText)) !== null) {
    const date = parsePersianDateFromText(match[1]);
    const time = normalizeTimeString(match[2]);
    if (!date || !time) continue;
    if (!byDate.has(date)) byDate.set(date, new Set());
    byDate.get(date)!.add(time);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([date, times]) => ({
      date: normalizeDateString(date),
      sessions: [...times]
        .sort()
        .map((time) => ({ time, purchaseUrl })),
    }));
}

function parseTiwallSessionsFromEventHtml(html: string, purchaseUrl: string): EventDay[] {
  const pageBaseInfo = html.match(
    /<div\s+class=["']page-base-info["'][\s\S]*?<!--\s*end of \.page-base-info/i
  );
  const scope = pageBaseInfo?.[0] ?? html;

  const dateMatch = scope.match(/class=["']theater-date["'][^>]*>([\s\S]*?)<\/div>/i);
  const dateText = dateMatch
    ? stripHtmlTags(dateMatch[1]).replace(/\s+/g, " ").trim()
    : "";
  const clockMatch = scope.match(
    /fa-clock[^>]*title=["']ساعت["'][^>]*><\/label>\s*([\d۰-۹]{1,2}:[\d۰-۹]{2})/i
  );
  const time = clockMatch ? normalizeTimeString(extractTimes(clockMatch[1])[0]) : "";
  if (!dateText || !time) return [];

  const segments = dateText
    .split(/\s*[-–—]\s*/)
    .map((segment) => segment.replace(/\s*\([^)]*\)/g, "").trim())
    .filter(Boolean);

  const parsedDates: string[] = [];
  for (const segment of segments) {
    const latin = toLatinDigits(segment);
    const crossRange = latin.match(/(\d{1,2})\s+(\S+?)\s+تا\s+(\d{1,2})\s+(\S+)/);
    if (crossRange) {
      const start = parsePersianDateFromText(`${crossRange[1]} ${crossRange[2]}`);
      const end = parsePersianDateFromText(`${crossRange[3]} ${crossRange[4]}`);
      if (start) parsedDates.push(start);
      if (end) parsedDates.push(end);
      continue;
    }
    const sameMonthRange = latin.match(/(\d{1,2})\s+تا\s+(\d{1,2})\s+(\S+)/);
    if (sameMonthRange) {
      const end = parsePersianDateFromText(`${sameMonthRange[2]} ${sameMonthRange[3]}`);
      if (end) parsedDates.push(end);
      continue;
    }
    const single = parsePersianDateFromText(segment);
    if (single) parsedDates.push(single);
  }

  if (parsedDates.length === 0) return [];

  return parsedDates.map((date) => ({
    date: normalizeDateString(date),
    sessions: [{ time, purchaseUrl }],
  }));
}

export function parseTiwallPage(
  html: string,
  sourceUrl: string,
  saleHtml?: string,
  cityNames?: string[]
): ParsedEventPartial {
  const ogTitle = extractMetaContent(html, "og:title");
  const titleTag = extractTitleTag(html);
  const h1 = extractH1(html);
  const rawTitle = ogTitle ?? h1 ?? titleTag ?? "";
  const title = cleanTiwallTitle(rawTitle);

  const imageUrl = extractMetaContent(html, "og:image");
  const plainText = stripHtmlTags(html);

  const place = extractTiwallVenue(html);
  const placeAddress = extractTiwallAddress(html);
  const saleUrl = extractTiwallSaleUrl(html, sourceUrl) ?? sourceUrl;
  const saleDays =
    saleHtml && saleUrl ? parseTiwallSessionsFromSaleHtml(saleHtml, saleUrl) : [];
  const pageDays = parseTiwallSessionsFromEventHtml(html, saleUrl);
  const plainDays = parseTiwallSessions(plainText, saleUrl);
  const days =
    saleDays.length > 0
      ? saleDays
      : pageDays.length > 0
        ? pageDays
        : plainDays;

  const cityResult = cityNames
    ? extractTiwallCity(html, place, placeAddress, cityNames)
    : resolveCity(`${placeAddress ?? ""} ${place}`);
  const categoryResult = inferCategory(`${title} ${plainText.slice(0, 800)}`);
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

export function tiwallSellsExternally(html: string): boolean {
  const plain = stripHtmlTags(html);
  return /فروش\s*اینترنتی\s*بلیت\s*در\s*دیگر\s*سایت/.test(plain);
}
