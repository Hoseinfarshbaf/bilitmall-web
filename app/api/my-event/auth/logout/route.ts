import { NextResponse } from "next/server";
import { clearMyEventSessionCookie } from "@/lib/my-event/session";

export async function POST() {
  await clearMyEventSessionCookie();
  return NextResponse.json({ success: true });
}
