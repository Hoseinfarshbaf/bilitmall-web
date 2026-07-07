import { NextResponse } from "next/server";
import { purgeStaleAdminEvents } from "@/lib/events";

export async function POST() {
  try {
    const result = await purgeStaleAdminEvents();
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "خطا در حذف رویدادهای قدیمی.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
