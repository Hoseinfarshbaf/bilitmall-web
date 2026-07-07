import { NextResponse } from "next/server";
import { clearBilitmallSessionCookie } from "@/lib/bilitmall/session";

export async function POST() {
  await clearBilitmallSessionCookie();
  return NextResponse.json({ success: true });
}
