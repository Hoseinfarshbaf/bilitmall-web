import { NextResponse } from "next/server";
import {
  listMyEventOrganizersForAdmin,
  updateMyEventOrganizerStatus,
} from "@/lib/my-event/store";

export async function GET() {
  const organizers = await listMyEventOrganizersForAdmin();
  return NextResponse.json(organizers);
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { id?: number; status?: string };
  const id = Number(body.id);
  const status = body.status?.trim();

  if (!id || !status) {
    return NextResponse.json({ error: "شناسه و وضعیت الزامی است." }, { status: 400 });
  }

  if (!["pending", "active", "suspended"].includes(status)) {
    return NextResponse.json({ error: "وضعیت نامعتبر است." }, { status: 400 });
  }

  await updateMyEventOrganizerStatus(id, status);
  return NextResponse.json({ success: true });
}
