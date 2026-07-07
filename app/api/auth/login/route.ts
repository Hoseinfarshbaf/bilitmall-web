import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { isValidIranMobile, normalizePhone } from "@/lib/auth/phone";
import { createBilitmallSessionToken } from "@/lib/bilitmall/auth";
import { getBilitmallUserByPhone } from "@/lib/bilitmall/store";
import { setBilitmallSessionCookie } from "@/lib/bilitmall/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string; password?: string };
    const phone = normalizePhone(body.phone ?? "");
    const password = body.password ?? "";

    if (!phone || !password) {
      return NextResponse.json(
        { error: "موبایل و رمز عبور الزامی است." },
        { status: 400 }
      );
    }

    if (!isValidIranMobile(phone)) {
      return NextResponse.json(
        { error: "شماره موبایل معتبر نیست." },
        { status: 400 }
      );
    }

    const user = await getBilitmallUserByPhone(phone);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "موبایل یا رمز عبور اشتباه است." },
        { status: 401 }
      );
    }

    const token = createBilitmallSessionToken({ userId: user.id });
    await setBilitmallSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, name: user.name, phone: user.phone },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در ورود";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
