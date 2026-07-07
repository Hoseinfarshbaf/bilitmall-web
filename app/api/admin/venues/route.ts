import { NextResponse } from "next/server";
import { searchVenueTemplates } from "@/lib/seating/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const city = searchParams.get("city") ?? "";
  const venues = await searchVenueTemplates(q, city);
  return NextResponse.json(venues);
}
