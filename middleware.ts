import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  extractOrganizerSlugFromHost,
  getMyEventPagesDomain,
  parseOrganizerSlugFromV2Host,
} from "@/lib/my-event/domains";

const PAGES_DOMAIN = process.env.MY_EVENT_PAGES_DOMAIN ?? getMyEventPagesDomain();

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const organizerFromV2 = parseOrganizerSlugFromV2Host(host);
  const organizerFromLegacy =
    PAGES_DOMAIN && host.endsWith(`.${PAGES_DOMAIN}`) && host !== PAGES_DOMAIN
      ? extractOrganizerSlugFromHost(host, PAGES_DOMAIN)
      : null;

  const organizerSlug = organizerFromV2 ?? organizerFromLegacy;

  if (organizerSlug) {
    const suffix = pathname === "/" ? "" : pathname;
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/sites/${organizerSlug}${suffix}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  if (!PAGES_DOMAIN) {
    return NextResponse.next();
  }

  if (host === PAGES_DOMAIN) {
    if (pathname === "/" || pathname === "") {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = "/my-event";
      return NextResponse.rewrite(rewriteUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
