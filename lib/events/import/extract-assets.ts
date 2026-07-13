import { extractMetaContent } from "./html-utils";
import { detectProvider } from "./fetch-page";

export type EventAssetUrls = {
  cardImageUrl?: string;
  bannerImageUrl?: string;
};

export function extractHonarticketAssetUrls(html: string): EventAssetUrls {
  const cardFromMeta = extractMetaContent(html, "og:image");
  const cardFromStatic =
    html.match(/https:\/\/static\.honarticket\.com\/resource\/files\/cache\/[^"'\s]+_image\.[a-z0-9]+/i)?.[0] ??
    html.match(/class=["']item-image["'][^>]*src=["']([^"']+)["']/i)?.[1] ??
    html.match(/<img[^>]*class=["'][^"']*item-image[^"']*["'][^>]*src=["']([^"']+)["']/i)?.[1];

  const coverMatch =
    html.match(/class=["']cover-image["'][^>]*src=["']([^"']+)["']/i) ??
    html.match(/<img[^>]*class=["'][^"']*cover-image[^"']*["'][^>]*src=["']([^"']+)["']/i) ??
    html.match(/src=["']([^"']+_cover\.[a-z0-9]+)["']/i);

  return {
    cardImageUrl: cardFromStatic
      ? decodeAssetUrl(cardFromStatic)
      : cardFromMeta,
    bannerImageUrl: coverMatch?.[1] ? decodeAssetUrl(coverMatch[1]) : undefined,
  };
}

export function extractTiwallAssetUrls(html: string): EventAssetUrls {
  const cardImageUrl =
    extractMetaContent(html, "og:image") ??
    html.match(/class=["']item-image["'][^>]*src=["']([^"']+)["']/i)?.[1] ??
    html.match(/<img[^>]*class=["'][^"']*item-image[^"']*["'][^>]*src=["']([^"']+)["']/i)?.[1];

  const coverMatch =
    html.match(/class=["']cover-image["'][^>]*src=["']([^"']+)["']/i) ??
    html.match(/<img[^>]*class=["'][^"']*cover-image[^"']*["'][^>]*src=["']([^"']+)["']/i) ??
    html.match(/src=["']([^"']+_cover\.[a-z0-9]+)["']/i);

  return {
    cardImageUrl: cardImageUrl ? decodeAssetUrl(cardImageUrl) : undefined,
    bannerImageUrl: coverMatch?.[1] ? decodeAssetUrl(coverMatch[1]) : undefined,
  };
}

function decodeAssetUrl(raw: string): string {
  return raw.replace(/&amp;/g, "&").trim();
}

export function extractEventAssetUrls(html: string, sourceUrl: string): EventAssetUrls {
  const provider = detectProvider(sourceUrl);
  if (provider === "tiwall") return extractTiwallAssetUrls(html);
  return extractHonarticketAssetUrls(html);
}
