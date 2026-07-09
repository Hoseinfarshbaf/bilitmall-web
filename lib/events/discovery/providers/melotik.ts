import {
  decodeHtmlEntities,
  extractJsonLd,
  extractMetaContent,
  stripHtmlTags,
} from "@/lib/events/import/html-utils";
import type { DiscoveredCatalogItem } from "../types";
import { isSkippableCatalogPath, resolveCatalogUrl } from "../url";

const MELOTIK_ORIGIN = "https://www.melotik.com";

const EXCLUDED_PATH_PREFIXES = [
  "/login",
  "/register",
  "/cart",
  "/about",
  "/contact",
  "/api",
  "/blog",
  "/tag",
  "/category",
];

function isEventLikePath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  if (isSkippableCatalogPath(path)) return false;
  if (EXCLUDED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) return false;
  // Typical melotik event slugs: /concert-name or /event/...
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return false;
  if (segments.length === 1 && segments[0].length >= 3) return true;
  if (segments[0] === "event" || segments[0] === "concert" || segments[0] === "events") {
    return segments.length >= 2;
  }
  return segments.length <= 2;
}

function titleFromSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse listing cards and links from melotik homepage / catalog HTML. */
export function parseMelotikCatalog(html: string): DiscoveredCatalogItem[] {
  const items: DiscoveredCatalogItem[] = [];
  const seen = new Set<string>();

  function addItem(href: string, title?: string, imageUrl?: string, dateHint?: string) {
    const path = href.split("?")[0];
    if (!isEventLikePath(path)) return;

    const url = resolveCatalogUrl("melotik", href);
    if (seen.has(url)) return;
    seen.add(url);

    const slug = path.replace(/^\//, "").split("/").pop() ?? path;
    const resolvedTitle = (title ?? titleFromSlug(slug)).trim();
    if (!resolvedTitle || resolvedTitle.length < 2) return;

    items.push({
      externalId: slug,
      title: resolvedTitle,
      url,
      imageUrl,
      dateHint,
      categoryHint: /نمایش|تئاتر/i.test(resolvedTitle) ? "تئاتر" : "کنسرت",
    });
  }

  // Card blocks with linked titles
  const cardRegex =
    /<a[^>]*href="([^"]+)"[^>]*>[\s\S]{0,1200}?<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = cardRegex.exec(html)) !== null) {
    const block = match[0];
    const href = decodeHtmlEntities(match[1].trim());
    if (!href.startsWith("/") && !href.includes("melotik.com")) continue;

    const title =
      block.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)?.[1] ??
      block.match(/class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\//i)?.[1] ??
      block.match(/alt="([^"]+)"/i)?.[1];

    const imageUrl = block.match(/<img[^>]+src="([^"]+)"/i)?.[1];
    const dateHint = block.match(/class=["'][^"']*date[^"']*["'][^>]*>([\s\S]*?)<\//i)?.[1];

    addItem(
      href,
      title ? stripHtmlTags(title) : undefined,
      imageUrl ? decodeHtmlEntities(imageUrl) : undefined,
      dateHint ? stripHtmlTags(dateHint) : undefined
    );
  }

  // Fallback: standalone internal links
  const hrefRegex = /href="(\/(?!\/)[^"#?]+)"/gi;
  while ((match = hrefRegex.exec(html)) !== null) {
    addItem(match[1]);
  }

  // JSON-LD events
  for (const node of extractJsonLd(html)) {
    const type = String(node["@type"] ?? "").toLowerCase();
    if (!type.includes("event")) continue;
    const url = typeof node.url === "string" ? node.url : undefined;
    const name = typeof node.name === "string" ? node.name : undefined;
    if (url) addItem(url, name);
  }

  const ogTitle = extractMetaContent(html, "og:title");
  const ogUrl = extractMetaContent(html, "og:url");
  if (ogUrl && ogTitle && isEventLikePath(new URL(ogUrl, MELOTIK_ORIGIN).pathname)) {
    addItem(ogUrl, ogTitle);
  }

  return items;
}

export const MELOTIK_CATALOG_URLS = [MELOTIK_ORIGIN];
