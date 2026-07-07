import { NextResponse } from "next/server";
import { getAllEvents, purgeStaleAdminEvents } from "@/lib/events";
import { isAdminListableEvent } from "@/lib/events/helpers";

export async function GET() {
  await purgeStaleAdminEvents();

  const events = (await getAllEvents({ includeUnpublished: true, includeEnded: true })).filter(
    (event) => isAdminListableEvent(event)
  );

  return NextResponse.json({ events, endedCount: 0 });
}
