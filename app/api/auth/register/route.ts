import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { isValidIranMobile, normalizePhone } from "@/lib/auth/phone";
import { createBilitmallSessionToken } from "@/lib/bilitmall/auth";
import { setBilitmallSessionCookie } from "@/lib/bilitmall/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      phone?: string;
      password?: string;
      email?: string;
    };

    const name = body.name?.trim() ?? "";
    const phone = normalizePhone(body.phone ?? "");
    const password = body.password ?? "";
    const email = body.email?.trim() || null;

    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: "نام، موبایل و رمز عبور الزامی است." },
        { status: 400 }
      );
    }

    if (!isValidIranMobile(phone)) {
      return NextResponse.json(
        { error: "شماره موبایل معتبر نیست." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "رمز عبور باید حداقل ۸ کاراکتر باشد." },
        { status: 400 }
      );
    }

    const existing = await prisma.bilitmallUser.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { error: "این شماره موبایل قبلاً در بلیت‌مال ثبت شده است." },
        { status: 409 }
      );
    }

    const user = await prisma.bilitmallUser.create({
      data: {
        phone,
        name,
        email,
        passwordHash: hashPassword(password),
      },
    });

    const token = createBilitmallSessionToken({ userId: user.id });
    await setBilitmallSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, name: user.name, phone: user.phone },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در ثبت‌نام";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
