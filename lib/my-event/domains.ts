/**
 * Production organizer shop: {organizer}.bilitmall.com/{eventSlug}
 * e.g. afra.bilitmall.com/dorehami
 * Local path (dev default): /sites/afra/dorehami
 *
 * Legacy hosts still rewrite via middleware:
 * - {organizer}.myevent.ae
 * - myevent.{organizer}.ae
 */

import { buildMyEventPublicPath } from "./public-slugs";

export const DEFAULT_BILITMALL_PAGES_DOMAIN = "bilitmall.com";

/** Subdomains that must never be treated as organizer shops */
export const RESERVED_BILITMALL_SUBDOMAINS = [
  "www",
  "api",
  "admin",
  "cdn",
  "static",
  "mail",
  "app",
  "staging",
  "my-event",
  "myevent",
] as const;

export function isReservedBilitmallSubdomain(slug: string): boolean {
  return (RESERVED_BILITMALL_SUBDOMAINS as readonly string[]).includes(
    slug.trim().toLowerCase()
  );
}

/** Apex domain for organizer subdomains (e.g. bilitmall.com) */
export function getBilitmallPagesDomain(): string {
  return (
    process.env.NEXT_PUBLIC_MY_EVENT_PAGES_DOMAIN ??
    process.env.MY_EVENT_PAGES_DOMAIN ??
    DEFAULT_BILITMALL_PAGES_DOMAIN
  );
}

/** @deprecated use getBilitmallPagesDomain */
export function getMyEventPagesDomain(): string {
  return getBilitmallPagesDomain();
}

export function getMyEventOrganizerHostname(organizerSlug: string): string {
  return `${organizerSlug}.${getBilitmallPagesDomain()}`;
}

export function formatMyEventEventLinkPreview(
  organizerSlug: string,
  publicEventSlug: string
): string {
  const slug = publicEventSlug.trim() || "eventname";
  return `${organizerSlug}.${getBilitmallPagesDomain()}/${slug}`;
}

/** Legacy: myevent.{organizer}.ae | myevent.{organizer}.localhost */
export function parseOrganizerSlugFromV2Host(host: string): string | null {
  const normalized = host.split(":")[0].toLowerCase();
  const match = normalized.match(
    /^myevent\.([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)\.(ae|localhost)$/
  );
  return match ? match[1] : null;
}

/** Legacy pages apex: myevent.ae (optional env override only for legacy rewrite) */
function getLegacyMyEventAeDomain(): string {
  return process.env.MY_EVENT_LEGACY_PAGES_DOMAIN ?? "myevent.ae";
}

export function isMyEventSubdomainHost(host: string, pagesDomain?: string): boolean {
  const domain = pagesDomain ?? getBilitmallPagesDomain();
  if (!domain) return false;
  const normalized = host.split(":")[0].toLowerCase();
  if (normalized === domain || !normalized.endsWith(`.${domain}`)) return false;
  const label = normalized.slice(0, -(domain.length + 1));
  if (!label || label.includes(".")) return false;
  if (isReservedBilitmallSubdomain(label)) return false;
  return true;
}

export function extractOrganizerSlugFromHost(
  host: string,
  pagesDomain?: string
): string | null {
  const domain = pagesDomain ?? getBilitmallPagesDomain();
  if (isMyEventSubdomainHost(host, domain)) {
    const normalized = host.split(":")[0].toLowerCase();
    return normalized.slice(0, -(domain.length + 1));
  }

  const v2 = parseOrganizerSlugFromV2Host(host);
  if (v2 && !isReservedBilitmallSubdomain(v2)) return v2;

  const legacyAe = getLegacyMyEventAeDomain();
  if (legacyAe !== domain && isMyEventSubdomainHost(host, legacyAe)) {
    const normalized = host.split(":")[0].toLowerCase();
    return normalized.slice(0, -(legacyAe.length + 1));
  }

  return null;
}

export function isMyEventPublicHost(host: string): boolean {
  return extractOrganizerSlugFromHost(host) !== null;
}

/** Working URL — local uses /sites path on same Next app by default */
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
