import { NextResponse } from "next/server";
import { getMyEventOrganizerProfile, getSessionMyEventOrganizer, splitPersonName } from "@/lib/my-event/store";
import { getMyEventSession } from "@/lib/my-event/session";

export async function GET() {
  const session = await getMyEventSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getSessionMyEventOrganizer(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getMyEventOrganizerProfile(user.myEventOrganizerId);
  const { firstName, lastName } = splitPersonName(user.name);

  return NextResponse.json({
    user: {
      id: user.id,
      firstName,
      lastName,
      name: user.name,
      phone: user.phone,
    },
    organizer: profile,
  });
}