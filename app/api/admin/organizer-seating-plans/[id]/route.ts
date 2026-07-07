import { NextResponse } from "next/server";
import {
  deleteOrganizerSeatingPlan,
  saveOrganizerSeatingPlanById,
} from "@/lib/seating/store";
import type { SeatingLayout } from "@/lib/seating/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const id = Number((await context.params).id);
  try {
    const body = (await request.json()) as { layout?: SeatingLayout };
    if (!body.layout) {
      return NextResponse.json({ error: "نقشه سالن ارسال نشده." }, { status: 400 });
    }

    const saved = await saveOrganizerSeatingPlanById(id, body.layout);
    if (!saved) {
      return NextResponse.json({ error: "نقشه سالن یافت نشد." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در ذخیره";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const id = Number((await context.params).id);
  try {
    const deleted = await deleteOrganizerSeatingPlan(id);
    if (!deleted) {
      return NextResponse.json({ error: "نقشه سالن یافت نشد." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در حذف";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
