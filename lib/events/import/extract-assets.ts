import { extractMetaContent } from "./html-utils";
import type { ImportProvider } from "./types";
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

export function extractMelotikAssetUrls(html: string): EventAssetUrls {
  const cardImageUrl = extractMetaContent(html, "og:image");
  const bannerMatch =
    html.match(/class=["'][^"']*banner[^"']*["'][^>]*src=["']([^"']+)["']/i) ??
    html.match(/<img[^>]*src=["']([^"']+banner[^"']+)["']/i);

  return {
    cardImageUrl,
    bannerImageUrl: bannerMatch?.[1] ? decodeAssetUrl(bannerMatch[1]) : undefined,
  };
}

export function extractGenericAssetUrls(html: string): EventAssetUrls {
  const cardImageUrl =
    extractMetaContent(html, "og:image") ?? extractMetaContent(html, "twitter:image");
  const bannerImageUrl =
    extractMetaContent(html, "og:image:secure_url") ?? cardImageUrl;

  return { cardImageUrl, bannerImageUrl };
}

function decodeAssetUrl(raw: string): string {
  return raw.replace(/&amp;/g, "&").trim();
}

export function extractEventAssetUrls(
  html: string,
  sourceUrl: string,
  provider?: ImportProvider
): EventAssetUrls {
  const resolved = provider ?? detectProvider(sourceUrl);

  switch (resolved) {
    case "honarticket":
      return extractHonarticketAssetUrls(html);
    case "melotik":
      return extractMelotikAssetUrls(html);
    default:
      return extractGenericAssetUrls(html);
  }
}
