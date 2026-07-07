import { NextResponse } from "next/server";
import { getBilitmallSession } from "@/lib/bilitmall/session";
import { getBilitmallUserProfile } from "@/lib/bilitmall/store";

export async function GET() {
  const session = await getBilitmallSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getBilitmallUserProfile(session.userId);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user: profile });
}
