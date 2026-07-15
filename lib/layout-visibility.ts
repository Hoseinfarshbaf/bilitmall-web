const HIDDEN_PREFIXES = ["/admin", "/account", "/my-event", "/sites"];

export function shouldShowMarketplaceChrome(pathname: string): boolean {
  return !HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function shouldShowMarketplaceNavbar(pathname: string): boolean {
  if (!shouldShowMarketplaceChrome(pathname)) return false;
  if (pathname.startsWith("/events")) return false;
  return true;
}

export function shouldShowMarketplaceFooter(pathname: string): boolean {
  if (!shouldShowMarketplaceChrome(pathname)) return false;
  // Event purchase page: keep ambient full-bleed without marketplace footer
  if (/^\/events\/[^/]+\/[^/]+\/[^/]+/.test(pathname)) return false;
  return true;
}
