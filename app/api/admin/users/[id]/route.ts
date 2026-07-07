import { NextResponse } from "next/server";
import {
  deleteBilitmallUserForAdmin,
  updateBilitmallUserForAdmin,
} from "@/lib/bilitmall/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const id = Number((await context.params).id);
  if (!id) {
    return NextResponse.json({ error: "شناسه نامعتبر است." }, { status: 400 });
  }

  const body = (await request.json()) as { name?: string; email?: string };
  const data: { name?: string; email?: string | null } = {};

  if (body.name?.trim()) data.name = body.name.trim();
  if (body.email !== undefined) data.email = body.email.trim() || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "تغییری ارسال نشده." }, { status: 400 });
  }

  try {
    const user = await updateBilitmallUserForAdmin(id, data);
    return NextResponse.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
    });
  } catch {
    return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const id = Number((await context.params).id);
  if (!id) {
    return NextResponse.json({ error: "شناسه نامعتبر است." }, { status: 400 });
  }

  try {
    await deleteBilitmallUserForAdmin(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
  }
}
