import { NextResponse } from "next/server";
import {
  listBilitmallListingRequestsForAdmin,
  updateBilitmallListingApproval,
} from "@/lib/my-event/store";

export async function GET() {
  const events = await listBilitmallListingRequestsForAdmin();
  return NextResponse.json(events);
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { id?: number; action?: string };
  const id = Number(body.id);
  const action = body.action;

  if (!id || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "شناسه و عملیات نامعتبر است." }, { status: 400 });
  }

  try {
    const updated = await updateBilitmallListingApproval(id, action);
    if (!updated) {
      return NextResponse.json({ error: "رویداد یافت نشد." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      listOnBilitmallApproved: updated.listOnBilitmallApproved,
      listOnBilitmallRequested: updated.listOnBilitmallRequested,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
