import { NextResponse } from "next/server";
import {
  deleteMyEventOrganizerForAdmin,
  updateMyEventOrganizerForAdmin,
} from "@/lib/my-event/store";
import { isValidMyEventSlug, normalizeMyEventSlug } from "@/lib/my-event/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const id = Number((await context.params).id);
  if (!id) {
    return NextResponse.json({ error: "شناسه نامعتبر است." }, { status: 400 });
  }

  const body = (await request.json()) as {
    displayName?: string;
    slug?: string;
    phone?: string;
    email?: string;
    bio?: string;
    status?: string;
  };

  const data: Parameters<typeof updateMyEventOrganizerForAdmin>[1] = {};

  if (body.displayName?.trim()) data.displayName = body.displayName.trim();
  if (body.phone !== undefined) data.phone = body.phone.trim() || null;
  if (body.email !== undefined) data.email = body.email.trim() || null;
  if (body.bio !== undefined) data.bio = body.bio.trim() || null;

  if (body.status && ["pending", "active", "suspended"].includes(body.status)) {
    data.status = body.status;
  }

  if (body.slug !== undefined) {
    const slug = normalizeMyEventSlug(body.slug);
    if (!isValidMyEventSlug(slug)) {
      return NextResponse.json({ error: "آدرس صفحه نامعتبر است." }, { status: 400 });
    }
    const taken = await prisma.myEventOrganizer.findFirst({
      where: { slug, NOT: { id } },
    });
    if (taken) {
      return NextResponse.json({ error: "این آدرس قبلاً ثبت شده." }, { status: 409 });
    }
    data.slug = slug;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "تغییری ارسال نشده." }, { status: 400 });
  }

  try {
    const organizer = await updateMyEventOrganizerForAdmin(id, data);
    return NextResponse.json(organizer);
  } catch {
    return NextResponse.json({ error: "برگزارکننده یافت نشد." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const id = Number((await context.params).id);
  if (!id) {
    return NextResponse.json({ error: "شناسه نامعتبر است." }, { status: 400 });
  }

  try {
    await deleteMyEventOrganizerForAdmin(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "برگزارکننده یافت نشد." }, { status: 404 });
  }
}
