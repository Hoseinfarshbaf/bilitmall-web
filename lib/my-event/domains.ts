/**
 * Production: myevent.{organizerBrand}.ae/{eventSlugEn}
 * e.g. myevent.coferoz.ae/asrhajar
 * Local host: myevent.coferoz.localhost:3000/asrhajar
 * Local path (bilitmall dev): /sites/coferoz/asrhajar
 */

import { buildMyEventPublicPath } from "./public-slugs";

const PRODUCT_LABEL = "myevent";

export function getMyEventRootTld(): string {
  return (
    process.env.NEXT_PUBLIC_MY_EVENT_ROOT_TLD ??
    (process.env.NODE_ENV === "development" ? "localhost" : "ae")
  );
}

/** TLD shown in link preview (future production domain) */
export function getMyEventPreviewTld(): string {
  return process.env.NEXT_PUBLIC_MY_EVENT_PREVIEW_TLD ?? "ae";
}

export function getMyEventOrganizerHostname(organizerSlug: string): string {
  return `${PRODUCT_LABEL}.${organizerSlug}.${getMyEventRootTld()}`;
}

export function formatMyEventEventLinkPreview(
  organizerSlug: string,
  publicEventSlug: string
): string {
  const slug = publicEventSlug.trim() || "eventname";
  return `${PRODUCT_LABEL}.${organizerSlug}.${getMyEventPreviewTld()}/${slug}`;
}

export function parseOrganizerSlugFromV2Host(host: string): string | null {
  const normalized = host.split(":")[0].toLowerCase();
  const match = normalized.match(
    /^myevent\.([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)\.(ae|localhost)$/
  );
  return match ? match[1] : null;
}

export function getMyEventPagesDomain(): string {
  return (
    process.env.NEXT_PUBLIC_MY_EVENT_PAGES_DOMAIN ??
    process.env.MY_EVENT_PAGES_DOMAIN ??
    ""
  );
}

export function isMyEventSubdomainHost(host: string, pagesDomain?: string): boolean {
  const domain = pagesDomain ?? getMyEventPagesDomain();
  if (!domain) return false;
  const normalized = host.split(":")[0].toLowerCase();
  return (
    normalized !== domain &&
    normalized.endsWith(`.${domain}`) &&
    !normalized.slice(0, -(domain.length + 1)).includes(".")
  );
}

export function extractOrganizerSlugFromHost(host: string, pagesDomain?: string): string | null {
  const v2 = parseOrganizerSlugFromV2Host(host);
  if (v2) return v2;

  const domain = pagesDomain ?? getMyEventPagesDomain();
  if (!isMyEventSubdomainHost(host, domain)) return null;
  const normalized = host.split(":")[0].toLowerCase();
  return normalized.slice(0, -(domain.length + 1));
}

export function isMyEventPublicHost(host: string): boolean {
  return (
    parseOrganizerSlugFromV2Host(host) !== null ||
    isMyEventSubdomainHost(host)
  );
}

/** Working URL — local uses /sites path on same Next app */
export function getMyEventPublicUrl(
  organizerSlug: string,
  publicEventSlug?: string
): string {
  const path = publicEventSlug ? buildMyEventPublicPath(publicEventSlug) : "";
  const sitePath = publicEventSlug
    ? `/sites/${organizerSlug}${path}`
    : `/sites/${organizerSlug}`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (process.env.NEXT_PUBLIC_MY_EVENT_USE_LOCAL_PATHS !== "false") {
    if (appUrl.startsWith("http")) {
      return `${appUrl.replace(/\/$/, "")}${sitePath}`;
    }
    return sitePath;
  }

  const protocol = appUrl.startsWith("https") ? "https" : "http";
  const hostname = getMyEventOrganizerHostname(organizerSlug);
  return `${protocol}://${hostname}${path}`;
}

export function getMyEventEventHref(
  organizerSlug: string,
  publicEventSlug: string,
  options?: { onSubdomain?: boolean }
): string {
  const path = buildMyEventPublicPath(publicEventSlug);
  if (options?.onSubdomain) {
    return path;
  }
  return `/sites/${organizerSlug}${path}`;
}

export function getMyEventOrganizerHomeHref(
  organizerSlug: string,
  options?: { onSubdomain?: boolean }
): string {
  if (options?.onSubdomain) {
    return "/";
  }
  return `/sites/${organizerSlug}`;
}
