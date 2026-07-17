import { NextResponse } from "next/server";

import {
  deleteMyEventEventForAdmin,
  listMyEventEventsForAdmin,
  removeMyEventFromBilitmallForAdmin,
  updateBilitmallListingApproval,
  updateMyEventEventApproval,
} from "@/lib/my-event/store";

export async function GET() {
  const events = await listMyEventEventsForAdmin();
  return NextResponse.json(events);
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id?: number;
    action?: string;
    approveMyEventPage?: boolean;
    approveBilitmall?: boolean;
  };
  const id = Number(body.id);

  if (!id || !body.action) {
    return NextResponse.json({ error: "شناسه و عملیات الزامی است." }, { status: 400 });
  }

  try {
    if (body.action === "reject") {
      const updated = await updateMyEventEventApproval(id, { action: "reject" });
      if (!updated) {
        return NextResponse.json({ error: "رویداد یافت نشد." }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        status: updated.status,
        published: updated.published,
        listOnBilitmallApproved: updated.listOnBilitmallApproved,
      });
    }

    if (body.action === "approve") {
      const updated = await updateMyEventEventApproval(id, {
        action: "approve",
        approveMyEventPage: body.approveMyEventPage,
        approveBilitmall: body.approveBilitmall,
      });
      if (!updated) {
        return NextResponse.json({ error: "رویداد یافت نشد." }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        status: updated.status,
        published: updated.published,
        listOnBilitmallApproved: updated.listOnBilitmallApproved,
      });
    }

    if (body.action === "approve_bilitmall") {
      const updated = await updateBilitmallListingApproval(id, "approve");
      if (!updated) {
        return NextResponse.json({ error: "رویداد یافت نشد." }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        listOnBilitmallApproved: updated.listOnBilitmallApproved,
        listOnBilitmallRequested: updated.listOnBilitmallRequested,
      });
    }

    if (body.action === "reject_bilitmall") {
      const updated = await updateBilitmallListingApproval(id, "reject");
      if (!updated) {
        return NextResponse.json({ error: "رویداد یافت نشد." }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        listOnBilitmallApproved: updated.listOnBilitmallApproved,
        listOnBilitmallRequested: updated.listOnBilitmallRequested,
      });
    }

    if (body.action === "remove_from_bilitmall") {
      const updated = await removeMyEventFromBilitmallForAdmin(id);
      if (!updated) {
        return NextResponse.json({ error: "رویداد یافت نشد." }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        listOnBilitmallApproved: updated.listOnBilitmallApproved,
      });
    }

    if (body.action === "delete") {
      const deleted = await deleteMyEventEventForAdmin(id);
      if (!deleted) {
        return NextResponse.json({ error: "رویداد یافت نشد." }, { status: 404 });
      }
      return NextResponse.json({ success: true, deleted: true });
    }

    return NextResponse.json({ error: "عملیات نامعتبر است." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در به‌روزرسانی";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));

  if (!id) {
    return NextResponse.json({ error: "شناسه الزامی است." }, { status: 400 });
  }

  const deleted = await deleteMyEventEventForAdmin(id);
  if (!deleted) {
    return NextResponse.json({ error: "رویداد یافت نشد." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
