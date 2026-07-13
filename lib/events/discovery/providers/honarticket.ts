import { decodeHtmlEntities, stripHtmlTags } from "@/lib/events/import/html-utils";
import type { DiscoveredCatalogItem } from "../types";
import { isSkippableCatalogPath, resolveCatalogUrl } from "../url";

const EXCLUDED_SLUGS = new Set([
  "about",
  "contact",
  "archive",
  "receipts",
  "s",
]);

/** Honarticket marks unavailable listings with these CSS classes on the card link. */
const NON_SELLABLE_CLASS_TOKENS = ["canceled", "inactive", "soldout"] as const;

function cleanHonarticketCardTitle(raw: string): string {
  return stripHtmlTags(raw)
    .replace(/\s+/g, " ")
    .trim();
}

function parseLocationLine(raw: string): { city?: string; place?: string } {
  const text = stripHtmlTags(raw).trim();
  if (!text) return {};

  const commaParts = text.split(/[،,]/).map((part) => part.trim()).filter(Boolean);
  if (commaParts.length >= 2) {
    return { city: commaParts[0], place: commaParts.slice(1).join("، ") };
  }
  return { place: text };
}

function isSellableStoreCard(classAttr: string): boolean {
  const tokens = classAttr.toLowerCase().split(/\s+/).filter(Boolean);
  return !NON_SELLABLE_CLASS_TOKENS.some((blocked) => tokens.includes(blocked));
}

function parseSaleState(cardHtml: string): { onSale: boolean; saleHint?: string } {
  const btnText = stripHtmlTags(
    cardHtml.match(/<span class=['"]btn['"][^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? ""
  )
    .replace(/\s+/g, " ")
    .trim();

  if (!btnText) return { onSale: true };

  const onSale = btnText.includes("خرید بلیت") && !btnText.includes("فروش از");
  return { onSale, saleHint: btnText };
}

function extractHonarticketStoreSections(html: string): string[] {
  const sections: string[] = [];
  const sectionRegex =
    /<div[^>]*class=['"][^'"]*events-list item-tiles store[^'"]*['"][^>]*>([\s\S]*?)<\/div>\s*<!-- end of \.events-list -->/gi;

  let match: RegExpExecArray | null;
  while ((match = sectionRegex.exec(html)) !== null) {
    const openingTag = html.slice(match.index, html.indexOf(">", match.index) + 1);
    if (/id=['"]scheduled-section['"]/i.test(openingTag)) continue;

    sections.push(match[1]);
  }

  if (sections.length === 0) {
    const gridRegex =
      /<div class="grid">([\s\S]*?)<\/div>\s*<!-- end of \.grid -->/gi;
    while ((match = gridRegex.exec(html)) !== null) {
      if (match[1].includes('id="item-')) sections.push(match[1]);
    }
  }

  return sections;
}

/**
 * Parse live store tiles from honarticket homepage.
 * Includes active sales and scheduled upcoming sales; excludes canceled/sold-out cards.
 */
export function parseHonarticketStoreCards(html: string): DiscoveredCatalogItem[] {
  const items: DiscoveredCatalogItem[] = [];
  const seen = new Set<string>();
  const sections = extractHonarticketStoreSections(html);

  const cardRegex =
    /<a\s+id="item-\d+"([^>]*)href="([^"]+)"([^>]*)>[\s\S]*?<img[^>]+class=["']item-image["'][^>]+src=["']([^"']+)["'][^>]*(?:alt="([^"]*)")?[\s\S]*?<h2>([\s\S]*?)<\/h2>[\s\S]*?i-location-light[^>]*><\/i>([^<]+)(?:[\s\S]*?theater-date[\s\S]*?i-calendar[^>]*><\/i>([^<]+))?/gi;

  for (const sectionHtml of sections) {
    let match: RegExpExecArray | null;
    while ((match = cardRegex.exec(sectionHtml)) !== null) {
      const classAttr = `${match[1]} ${match[3]}`;
      if (!isSellableStoreCard(classAttr)) continue;

      const href = decodeHtmlEntities(match[2].trim());
      const path = href.split("?")[0];
      if (isSkippableCatalogPath(path)) continue;

      const slug = path.replace(/^\//, "").toLowerCase();
      if (!slug || EXCLUDED_SLUGS.has(slug)) continue;

      const url = resolveCatalogUrl("honarticket", href);
      if (seen.has(url)) continue;
      seen.add(url);

      const imageUrl = decodeHtmlEntities(match[4].trim());
      const altTitle = decodeHtmlEntities(match[5] ?? "").trim();
      const h2Title = cleanHonarticketCardTitle(match[6]);
      const title = h2Title || altTitle;
      if (!title) continue;

      const location = parseLocationLine(match[7] ?? "");
      const dateHint = stripHtmlTags(match[8] ?? "").trim() || undefined;
      const { onSale, saleHint } = parseSaleState(match[0]);

      items.push({
        externalId: slug,
        title,
        url,
        imageUrl: imageUrl || undefined,
        city: location.city,
        place: location.place,
        dateHint,
        onSale,
        saleHint,
        categoryHint: h2Title.includes("کنسرت")
          ? "کنسرت"
          : h2Title.includes("نمایش")
            ? "تئاتر"
            : undefined,
      });
    }
  }

  return items;
}

export const HONARTICKET_CATALOG_URLS = ["https://www.honarticket.com/"];
