import { NextResponse } from "next/server";
import { listCatalogVenues, type VenueListFilters } from "@/lib/seating/store";

/** All approved venues (admin + organizer-approved) — used in event place autocomplete */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: VenueListFilters = {
      q: searchParams.get("q") ?? undefined,
      city: searchParams.get("city") ?? undefined,
      source: (searchParams.get("source") as VenueListFilters["source"]) ?? undefined,
    };
    const venues = await listCatalogVenues(filters);
    return NextResponse.json(venues);
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در بارگذاری سالن‌ها";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
