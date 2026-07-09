import type { DiscoveryProviderId } from "./types";

const PROVIDER_ORIGINS: Record<DiscoveryProviderId, string> = {
  honarticket: "https://www.honarticket.com",
  melotik: "https://www.melotik.com",
};

export function getProviderOrigin(provider: DiscoveryProviderId): string {
  return PROVIDER_ORIGINS[provider];
}

export function resolveCatalogUrl(provider: DiscoveryProviderId, href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  const origin = getProviderOrigin(provider);
  return new URL(href, origin).toString();
}

export function normalizeExternalUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    parsed.search = "";
    let path = parsed.pathname.replace(/\/+$/, "");
    if (!path) path = "/";
    parsed.pathname = path;
    return parsed.toString().toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function externalPathKey(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/\/+$/, "").toLowerCase() || "/";
  } catch {
    return url.toLowerCase();
  }
}

export function isSkippableCatalogPath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return (
    path === "/" ||
    /^\/(about|contact|archive|receipts|login|register|cart|api|resource|css|js|images|s|site\.webmanifest)(\/|$)/.test(
      path
    )
  );
}
