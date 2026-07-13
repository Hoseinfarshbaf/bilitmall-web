import { NextResponse } from "next/server";
import { removeEvents } from "@/lib/events";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { ids?: unknown };
    const rawIds = body.ids;

    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      return NextResponse.json(
        { error: "حداقل یک شناسه رویداد برای حذف لازم است." },
        { status: 400 }
      );
    }

    const ids = rawIds.map((value) => Number(value)).filter((id) => Number.isInteger(id) && id > 0);

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "شناسه‌های رویداد نامعتبر هستند." },
        { status: 400 }
      );
    }

    const result = await removeEvents(ids);

    if (result.deleted === 0) {
      return NextResponse.json(
        { error: "هیچ رویدادی حذف نشد.", ...result },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "خطا در حذف گروهی رویدادها.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
