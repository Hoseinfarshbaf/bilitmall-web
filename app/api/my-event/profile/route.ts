import { NextResponse } from "next/server";
import { getMyEventSession } from "@/lib/my-event/session";
import {
  getSessionMyEventOrganizer,
  splitPersonName,
  updateMyEventOrganizerProfile,
} from "@/lib/my-event/store";

export async function PUT(request: Request) {
  const session = await getMyEventSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getSessionMyEventOrganizer(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    firstName?: string;
    lastName?: string;
    phone?: string;
    displayName?: string;
    slug?: string;
    bio?: string;
    email?: string;
    coverImage?: string;
    logoImage?: string;
    avatarImage?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  const result = await updateMyEventOrganizerProfile(
    user.id,
    user.myEventOrganizerId,
    body
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { firstName, lastName } = splitPersonName(result.userName);

  return NextResponse.json({
    user: {
      id: user.id,
      firstName,
      lastName,
      name: result.userName,
      phone: result.userPhone,
    },
    organizer: result.profile,
  });
}
