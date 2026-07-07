import { NextResponse } from "next/server";
import { promoteOrganizerSeatingPlanToVenueTemplate } from "@/lib/seating/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const id = Number((await context.params).id);
    const result = await promoteOrganizerSeatingPlanToVenueTemplate(id);
    if (!result) {
      return NextResponse.json({ error: "نقشه سالن یافت نشد." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      venueTemplateId: result.id,
      name: result.name,
      updated: result.updated,
      message: result.updated
        ? "سالن در فهرست کل سالن‌ها به‌روزرسانی شد و در جستجوی مکان برگزاری قابل انتخاب است."
        : "سالن تأیید شد و به فهرست کل سالن‌ها اضافه شد.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در تأیید سالن";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
