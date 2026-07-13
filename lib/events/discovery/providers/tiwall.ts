import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import {
  normalizeTimeString,
  parsePersianDateTime,
  toLatinDigits,
} from "@/lib/events/date-utils";
import { decodeHtmlEntities, stripHtmlTags } from "@/lib/events/import/html-utils";
import {
  extractTiwallAddress,
  tiwallSellsExternally,
} from "@/lib/events/import/providers/tiwall";
import { extractTimes, parsePersianDateFromText } from "@/lib/events/import/persian-parse";
import type { DiscoveredCatalogItem } from "../types";
import { isSkippableCatalogPath, resolveCatalogUrl } from "../url";

const EXCLUDED_SLUGS = new Set([
  "vod.package",
  "vod",
  "about",
  "contact",
  "sale",
  "tap30",
]);

export const TIWALL_POPULAR_MIN_REVIEWS = 30;
export const TIWALL_POPULAR_MIN_REVIEWS_HIGH_RATING = 15;
export const TIWALL_POPULAR_MIN_RATING = 4;
export const TIWALL_POPULAR_MAX_SALE_RANK = 35;

const CITY_TOKENS = [
  "تهران",
  "تبریز",
  "اصفهان",
  "شیراز",
  "مشهد",
  "رشت",
  "کرمان",
  "اهواز",
  "کرج",
  "گرگان",
  "بابل",
  "کرمانشاه",
  "قم",
  "یزد",
  "ارومیه",
  "همدان",
  "بندرعباس",
];

type CardBlock = {
  slug: string;
  href: string;
  block: string;
};

type ParsedCardSchedule = {
  dateHint: string;
  endDate: string;
  time: string;
};

function parseLatinInt(value: string): number {
  return Number(toLatinDigits(value).replace(/,/g, "")) || 0;
}

function parseRating(
  text: string
): { reviewCount: number; avgRating: number } | null {
  const match = text.match(/([\d۰-۹][\d۰-۹,]*)\s*★\s*([\d۰-۹]+[٫.][\d۰-۹]+)/);
  if (!match) return null;
  return {
    reviewCount: parseLatinInt(match[1]),
    avgRating: Number(toLatinDigits(match[2]).replace("٫", ".")) || 0,
  };
}

function cleanCardTitle(raw: string): string {
  return stripHtmlTags(raw)
    .replace(/^(نمایش|کنسرت|رویداد|فیلم‌تئاتر|فیلم تئاتر|پرفورمنس|نمایشنامه‌خوانی)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseLocationFromVenue(venue: string): { city?: string; place: string } | null {
  const place = venue.replace(/\s+/g, " ").trim();
  if (!place || place.length < 4) return null;

  const trailingCity = [...place.matchAll(
    new RegExp(`(?:^|[\\s،,-])(${CITY_TOKENS.join("|")})(?:\\s|$)`, "g")
  )].pop()?.[1];

  return { city: trailingCity, place };
}

function extractVenueFromBlock(block: string): string | undefined {
  const match = block.match(/fa-map-marker-alt[^>]*>[\s\S]*?<\/div>/i);
  if (!match) return undefined;
  return (
    stripHtmlTags(match[0])
      .replace(/\s+/g, " ")
      .replace(/^.*?>\s*/i, "")
      .trim() || undefined
  );
}

function hasDirectTiwallSale(block: string): boolean {
  return /data-saleurn=["']\/s\/[^"']+["']/i.test(block);
}

function parseSaleState(
  text: string,
  block: string
): {
  onSale: boolean;
  saleHint?: string;
  skip: boolean;
} {
  if (/پُر\s*شد|پر\s*شد/.test(text)) {
    return { onSale: false, skip: true };
  }

  if (/فروش\s*از\s*فردا|خرید\s*از\s*فردا|به‌زودی|به زودی/.test(text)) {
    return { onSale: false, skip: true };
  }

  const ended = /پایان\s*یافته|امکان\s*خرید\s*پایان/.test(text);
  const workshopOnly = /ثبت\s*نام/.test(text) && !/خرید\s*بلیت/.test(text);
  const vodOnly =
    /دانلود|فیلم‌تئاتر|سریال/.test(text) && !/خرید\s*بلیت/.test(text);

  if (ended || workshopOnly || vodOnly) {
    return { onSale: false, skip: true };
  }

  if (!/خرید\s*بلیت/.test(text) || !hasDirectTiwallSale(block)) {
    return { onSale: false, skip: true };
  }

  return { onSale: true, saleHint: "خرید بلیت", skip: false };
}

function extractTheaterDate(block: string): string | undefined {
  const match = block.match(/class=["']theater-date["'][^>]*>([\s\S]*?)<\/div>/i);
  if (!match) return undefined;
  return stripHtmlTags(match[1]).replace(/\s+/g, " ").trim() || undefined;
}

function extractTheaterTime(block: string): string | undefined {
  const match = block.match(/class=["']theater-time["'][^>]*>([\s\S]*?)<\/div>/i);
  if (!match) return undefined;
  return extractTimes(stripHtmlTags(match[1]))[0];
}

function isMonthOnlyDateText(text: string): boolean {
  const latin = toLatinDigits(text).replace(/\s+/g, " ").trim();
  return /^(فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|شهريور|مهر|آبان|آذر|دی|بهمن|اسفند)\s+14\d{2}$/i.test(
    latin
  );
}

function isVagueDateText(text: string): boolean {
  const latin = toLatinDigits(text).replace(/\s+/g, " ").trim();
  if (!latin || isMonthOnlyDateText(text)) return true;
  if (!/\d/.test(latin)) return true;
  if (
    /^(فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|شهريور|مهر|آبان|آذر|دی|بهمن|اسفند)\s+و\s+(فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|شهريور|مهر|آبان|آذر|دی|بهمن|اسفند)/i.test(
      latin
    )
  ) {
    return true;
  }
  return false;
}

function ensureEndAfterStart(start: string, end: string): string {
  if (end >= start) return end;
  const [year, month, day] = end.split("/").map(Number);
  return `${year + 1}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
}

function parseCardSchedule(dateText: string, time: string): ParsedCardSchedule | null {
  const normalizedTime = normalizeTimeString(toLatinDigits(time));
  if (!/^\d{2}:\d{2}$/.test(normalizedTime)) return null;

  const cleanedDateText = dateText.replace(/\s*\([^)]*\)/g, "").trim();
  const hint = toLatinDigits(cleanedDateText).replace(/\s+/g, " ").trim();
  if (!hint || isVagueDateText(cleanedDateText)) return null;

  if (/^از\s+/.test(hint)) return null;

  const yearSuffix = hint.match(/14\d{2}/)?.[0];

  const crossRange = hint.match(
    /(\d{1,2})\s+(\S+?)\s+تا\s+(\d{1,2})\s+(\S+?)(?:\s+(14\d{2}))?/
  );
  if (crossRange) {
    const year = crossRange[5] ?? yearSuffix;
    const yearPart = year ? ` ${year}` : "";
    const start = parsePersianDateFromText(`${crossRange[1]} ${crossRange[2]}${yearPart}`);
    const end = parsePersianDateFromText(`${crossRange[3]} ${crossRange[4]}${yearPart}`);
    if (start && end) {
      return {
        dateHint: dateText.replace(/\s+/g, " ").trim(),
        endDate: ensureEndAfterStart(start, end),
        time: normalizedTime,
      };
    }
  }

  const sameMonthRange = hint.match(/(\d{1,2})\s+تا\s+(\d{1,2})\s+(\S+?)(?:\s+(14\d{2}))?/);
  if (sameMonthRange) {
    const year = sameMonthRange[4] ?? yearSuffix;
    const yearPart = year ? ` ${year}` : "";
    const start = parsePersianDateFromText(`${sameMonthRange[1]} ${sameMonthRange[3]}${yearPart}`);
    const end = parsePersianDateFromText(`${sameMonthRange[2]} ${sameMonthRange[3]}${yearPart}`);
    if (start && end) {
      return {
        dateHint: dateText.replace(/\s+/g, " ").trim(),
        endDate: ensureEndAfterStart(start, end),
        time: normalizedTime,
      };
    }
  }

  const weekdayStripped = hint.replace(
    /^(?:شنبه|یکشنبه|دوشنبه|سه‌شنبه|سه شنبه|چهارشنبه|پنجشنبه|جمعه)\s+/,
    ""
  );
  const singleYear = weekdayStripped.match(/(14\d{2})/)?.[1];
  const single = parsePersianDateFromText(
    singleYear && !/\s14\d{2}\s*$/.test(weekdayStripped)
      ? `${weekdayStripped} ${singleYear}`
      : weekdayStripped
  );
  if (single) {
    return {
      dateHint: dateText.replace(/\s+/g, " ").trim(),
      endDate: single,
      time: normalizedTime,
    };
  }

  return null;
}

function hasUpcomingSession(schedule: ParsedCardSchedule): boolean {
  const [year] = schedule.endDate.split("/").map(Number);
  const currentYear = new DateObject({ calendar: persian }).year;
  if (year < currentYear) return false;

  const sessionEnd = parsePersianDateTime(schedule.endDate, schedule.time);
  return sessionEnd >= new Date();
}

function trimBeforePastSection(html: string): string {
  const markers = [
    /نمایش‌های\s*گذشته/i,
    /کنسرت‌های\s*گذشته/i,
    /######\s*نمایش‌های\s*گذشته/i,
    /######\s*کنسرت‌های\s*گذشته/i,
  ];
  let cutAt = html.length;
  for (const marker of markers) {
    const index = html.search(marker);
    if (index > 0) cutAt = Math.min(cutAt, index);
  }
  return html.slice(0, cutAt);
}

function extractShowcaseCardBlocks(html: string): CardBlock[] {
  const scoped = trimBeforePastSection(html);
  const linkRegex =
    /<a class=['"]item-page(?:\s[^'"]*)?['"][^>]*href=["'](?:https?:\/\/(?:www\.)?tiwall\.com)?\/p\/([a-z0-9._-]+)["'][\s\S]*?(?=<a class=['"]item-page|<div class=['"]clear['"]>\s*<\/div>\s*<\/div><!-- list -->|$)/gi;

  const matches = [...scoped.matchAll(linkRegex)];
  const bySlug = new Map<string, CardBlock>();

  for (const match of matches) {
    const slug = match[1].toLowerCase();
    if (EXCLUDED_SLUGS.has(slug) || slug.startsWith("vod.")) continue;

    const block = match[0];
    const href = `/p/${slug}`;
    const existing = bySlug.get(slug);
    if (!existing || block.length > existing.block.length) {
      bySlug.set(slug, { slug, href, block });
    }
  }

  return [...bySlug.values()];
}

function isPopularEnough(
  reviewCount: number,
  avgRating: number,
  rank: number,
  fromSaleFeed: boolean
): boolean {
  if (reviewCount >= TIWALL_POPULAR_MIN_REVIEWS) return true;
  if (
    reviewCount >= TIWALL_POPULAR_MIN_REVIEWS_HIGH_RATING &&
    avgRating >= TIWALL_POPULAR_MIN_RATING
  ) {
    return true;
  }
  if (fromSaleFeed && rank <= TIWALL_POPULAR_MAX_SALE_RANK && reviewCount >= 10) {
    return true;
  }
  return false;
}

function inferCategory(title: string, plain: string): string | undefined {
  if (/^کنسرت|کنسرت\s/i.test(title) || plain.includes("کنسرت")) return "کنسرت";
  if (/^نمایش|نمایش\s/i.test(title) || plain.includes("نمایش")) return "تئاتر";
  return undefined;
}

function parseImageUrl(block: string): string | undefined {
  const match =
    block.match(/<img[^>]+src=["']([^"']+)["']/i) ??
    block.match(/data-src=["']([^"']+)["']/i);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : undefined;
}

function dedupeByUrl(items: DiscoveredCatalogItem[]): DiscoveredCatalogItem[] {
  const byUrl = new Map<string, DiscoveredCatalogItem>();
  for (const item of items) {
    const existing = byUrl.get(item.url);
    if (!existing || (item.reviewCount ?? 0) > (existing.reviewCount ?? 0)) {
      byUrl.set(item.url, item);
    }
  }
  return [...byUrl.values()];
}

export function toSbTiwallFetchUrl(url: string): string {
  return url.replace(/https?:\/\/(www\.)?tiwall\.com/i, "https://sb.tiwall.com");
}

function extractPagePerformanceSchedule(html: string): ParsedCardSchedule | null {
  const dateMatch = html.match(/class=["']theater-date["'][^>]*>([\s\S]*?)<\/div>/i);
  const dateText = dateMatch
    ? stripHtmlTags(dateMatch[1]).replace(/\s+/g, " ").trim()
    : "";

  const clockMatch = html.match(
    /fa-clock[^>]*title=["']ساعت["'][^>]*><\/label>\s*([\d۰-۹]{1,2}:[\d۰-۹]{2})/i
  );
  const timeText = clockMatch ? extractTimes(clockMatch[1])[0] : undefined;

  if (!dateText || !timeText) return null;

  const segments = dateText
    .split(/\s*[-–—]\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (let i = segments.length - 1; i >= 0; i--) {
    const schedule = parseCardSchedule(segments[i], timeText);
    if (schedule && hasUpcomingSession(schedule)) return schedule;
  }

  const full = parseCardSchedule(dateText, timeText);
  if (full && hasUpcomingSession(full)) return full;
  return null;
}

export function isTiwallPageEligibleForDiscovery(
  html: string,
  candidate: DiscoveredCatalogItem
): boolean {
  if (tiwallSellsExternally(html)) return false;

  const plain = stripHtmlTags(html);
  if (/پُر\s*شد|پر\s*شد/.test(plain)) return false;
  if (/فروش\s*از\s*فردا|خرید\s*از\s*فردا/.test(plain)) return false;
  if (!/خرید\s*بلیت/.test(plain)) return false;
  if (!candidate.place?.trim()) return false;
  if (!extractTiwallAddress(html)?.trim()) return false;

  const schedule = extractPagePerformanceSchedule(html);
  return Boolean(schedule && hasUpcomingSession(schedule));
}

export function enrichTiwallItemFromPage(
  item: DiscoveredCatalogItem,
  html: string
): DiscoveredCatalogItem {
  const schedule = extractPagePerformanceSchedule(html);

  return {
    ...item,
    dateHint: schedule?.dateHint ?? item.dateHint,
    onSale: true,
    saleHint: "خرید بلیت",
  };
}

/** کارت‌های فید پرفروش/محبوب تیوال */
export function parseTiwallShowcaseCards(
  html: string,
  catalogUrl: string
): DiscoveredCatalogItem[] {
  const fromSaleFeed = /order=sale/i.test(catalogUrl);
  const items: DiscoveredCatalogItem[] = [];
  const seen = new Set<string>();
  let rank = 0;

  for (const card of extractShowcaseCardBlocks(html)) {
    const path = card.href.split("?")[0];
    if (isSkippableCatalogPath(path)) continue;

    const url = resolveCatalogUrl("tiwall", card.href);
    if (seen.has(url)) continue;

    const plain = stripHtmlTags(card.block);
    const sale = parseSaleState(plain, card.block);
    if (sale.skip) continue;

    const venueText = extractVenueFromBlock(card.block);
    if (!venueText) continue;
    const location = parseLocationFromVenue(venueText);
    if (!location) continue;

    const dateText = extractTheaterDate(card.block);
    const timeText = extractTheaterTime(card.block);
    if (!dateText || !timeText) continue;

    const schedule = parseCardSchedule(dateText, timeText);
    if (!schedule || !hasUpcomingSession(schedule)) continue;

    rank += 1;
    const rating = parseRating(plain);
    const reviewCount = rating?.reviewCount ?? 0;
    const avgRating = rating?.avgRating ?? 0;

    if (!isPopularEnough(reviewCount, avgRating, rank, fromSaleFeed)) {
      continue;
    }

    const h2Match = card.block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const title = cleanCardTitle(h2Match?.[1] ?? "");
    if (!title || title.length < 2) continue;

    seen.add(url);

    items.push({
      externalId: card.slug,
      title,
      url,
      imageUrl: parseImageUrl(card.block),
      city: location.city,
      place: location.place,
      dateHint: schedule.dateHint,
      onSale: sale.onSale,
      saleHint: sale.saleHint,
      categoryHint: inferCategory(title, plain),
      reviewCount: reviewCount || undefined,
      avgRating: avgRating || undefined,
      popularityRank: rank,
    });
  }

  return items;
}

export async function discoverTiwallPopularEvents(
  fetchHtml: (url: string) => Promise<string>
): Promise<DiscoveredCatalogItem[]> {
  const collected: DiscoveredCatalogItem[] = [];

  for (const catalogUrl of TIWALL_CATALOG_URLS) {
    const html = await fetchHtml(catalogUrl);
    collected.push(...parseTiwallShowcaseCards(html, catalogUrl));
  }

  const candidates = dedupeByUrl(collected);
  const validated: DiscoveredCatalogItem[] = [];

  for (const item of candidates) {
    try {
      const fetchUrl = toSbTiwallFetchUrl(item.url);
      const html = await fetchHtml(fetchUrl);
      if (!isTiwallPageEligibleForDiscovery(html, item)) continue;
      validated.push(enrichTiwallItemFromPage(item, html));
    } catch {
      continue;
    }
  }

  return validated;
}

/** فید پرفروش نمایش و کنسرت تیوال */
export const TIWALL_CATALOG_URLS = [
  "https://sb.tiwall.com/showcase?filters=s:theater&order=sale",
  "https://sb.tiwall.com/showcase?filters=s:music&order=sale",
];
