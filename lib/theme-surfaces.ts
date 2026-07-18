/** Surfaces that own theme independently from the marketplace html.dark writer. */

export function isAdminPathname(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isMyEventStudioPathname(pathname: string): boolean {
  return pathname === "/my-event" || pathname.startsWith("/my-event/");
}

export function isOrganizerPublicPathname(pathname: string): boolean {
  return pathname === "/sites" || pathname.startsWith("/sites/");
}

/**
 * Marketplace ThemeProvider must not write html.dark on these routes.
 * Also clears leftover marketplace dark so admin / studio / sites stay isolated.
 */
export function shouldSkipMarketplaceDocumentTheme(pathname: string): boolean {
  return (
    isAdminPathname(pathname) ||
    isMyEventStudioPathname(pathname) ||
    isOrganizerPublicPathname(pathname)
  );
}
