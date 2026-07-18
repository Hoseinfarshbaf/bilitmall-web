import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  extractOrganizerSlugFromHost,
  getBilitmallPagesDomain,
} from "@/lib/my-event/domains";

const PAGES_DOMAIN =
  process.env.MY_EVENT_PAGES_DOMAIN ?? getBilitmallPagesDomain();

function withPathHeaders(
  request: NextRequest,
  extras?: Record<string, string>
): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-organizer-public", "0");
  if (extras) {
    for (const [key, value] of Object.entries(extras)) {
      requestHeaders.set(key, value);
    }
  }
  return requestHeaders;
}

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

  // Apex / www stay on the marketplace — never rewrite to /my-event
  if (host === PAGES_DOMAIN || host === `www.${PAGES_DOMAIN}`) {
    return NextResponse.next({
      request: { headers: withPathHeaders(request) },
    });
  }

  const organizerSlug = extractOrganizerSlugFromHost(host, PAGES_DOMAIN);

  if (organizerSlug) {
    const suffix = pathname === "/" ? "" : pathname;
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/sites/${organizerSlug}${suffix}`;
    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: withPathHeaders(request, {
          "x-organizer-public": "1",
          "x-organizer-slug": organizerSlug,
        }),
      },
    });
  }

  return NextResponse.next({
    request: { headers: withPathHeaders(request) },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
