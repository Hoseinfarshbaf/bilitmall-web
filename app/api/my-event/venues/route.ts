import { NextResponse } from "next/server";
import { getMyEventSession } from "@/lib/my-event/session";
import { getSessionMyEventOrganizer } from "@/lib/my-event/store";
import { searchVenueTemplates } from "@/lib/seating/store";

export async function GET(request: Request) {
  const session = await getMyEventSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getSessionMyEventOrganizer(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const city = searchParams.get("city") ?? "";
  const venues = await searchVenueTemplates(q, city);
  return NextResponse.json(venues);
}
