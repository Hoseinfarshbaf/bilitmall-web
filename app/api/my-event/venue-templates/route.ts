import { NextResponse } from "next/server";
import { getMyEventSession } from "@/lib/my-event/session";
import { getSessionMyEventOrganizer } from "@/lib/my-event/store";
import { listVenueTemplates } from "@/lib/seating/store";

export async function GET() {
  const session = await getMyEventSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getSessionMyEventOrganizer(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await listVenueTemplates();
  return NextResponse.json(templates);
}
