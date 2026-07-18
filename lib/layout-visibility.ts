import { isMyEventPublicHost } from "@/lib/my-event/domains";

const HIDDEN_PREFIXES = ["/admin", "/account", "/my-event", "/sites"];

export type MarketplaceChromeOptions = {
  /** Set by middleware when host is an organizer public subdomain. */
  organizerPublic?: boolean;
  /** Browser or request host (without port). */
  host?: string;
};

function getBrowserHost(): string {
  if (typeof window === "undefined") return "";
  return window.location.host.split(":")[0]?.toLowerCase() ?? "";
}

export function shouldShowMarketplaceChrome(
  pathname: string,
  options?: MarketplaceChromeOptions
): boolean {
  if (options?.organizerPublic) return false;
  const host = options?.host ?? getBrowserHost();
  if (host && isMyEventPublicHost(host)) return false;
  return !HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function shouldShowMarketplaceNavbar(
  pathname: string,
  options?: MarketplaceChromeOptions
): boolean {
  if (!shouldShowMarketplaceChrome(pathname, options)) return false;
  if (pathname.startsWith("/events")) return false;
  return true;
}

export function shouldShowMarketplaceFooter(
  pathname: string,
  options?: MarketplaceChromeOptions
): boolean {
  if (!shouldShowMarketplaceChrome(pathname, options)) return false;
  // Event purchase page: keep ambient full-bleed without marketplace footer
  if (/^\/events\/[^/]+\/[^/]+\/[^/]+/.test(pathname)) return false;
  return true;
}
