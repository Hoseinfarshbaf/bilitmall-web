import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getBilitmallSession } from "@/lib/bilitmall/session";
import { getBilitmallUserProfile } from "@/lib/bilitmall/store";

export async function GET() {
  const session = await getBilitmallSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getBilitmallUserProfile(session.userId);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const session = await getBilitmallSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  const user = await prisma.bilitmallUser.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data: { name?: string; email?: string | null; passwordHash?: string } = {};

  if (body.name?.trim()) {
    data.name = body.name.trim();
  }

  if (body.email !== undefined) {
    data.email = body.email.trim() || null;
  }

  if (body.newPassword) {
    if (!body.currentPassword || !verifyPassword(body.currentPassword, user.passwordHash)) {
      return NextResponse.json(
        { error: "رمز عبور فعلی اشتباه است." },
        { status: 400 }
      );
    }

    if (body.newPassword.length < 8) {
      return NextResponse.json(
        { error: "رمز جدید باید حداقل ۸ کاراکتر باشد." },
        { status: 400 }
      );
    }

    data.passwordHash = hashPassword(body.newPassword);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "تغییری ارسال نشده." }, { status: 400 });
  }

  await prisma.bilitmallUser.update({
    where: { id: session.userId },
    data,
  });

  const profile = await getBilitmallUserProfile(session.userId);
  return NextResponse.json(profile);
}
