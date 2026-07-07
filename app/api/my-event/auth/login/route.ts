import { NextResponse } from "next/server";
import { createSessionToken, verifyPassword } from "@/lib/my-event/auth";
import { normalizePhone } from "@/lib/auth/phone";
import { getMyEventUserByPhone } from "@/lib/my-event/store";
import { setMyEventSessionCookie } from "@/lib/my-event/session";

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

    const user = await getMyEventUserByPhone(phone);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "موبایل یا رمز عبور اشتباه است." },
        { status: 401 }
      );
    }

    if (user.myEventOrganizer.status === "pending") {
      return NextResponse.json(
        {
          error:
            "حساب شما هنوز تأیید نشده است. پس از تأیید ادمین، از طریق پیامک به شما اطلاع داده می‌شود.",
        },
        { status: 403 }
      );
    }

    if (user.myEventOrganizer.status === "suspended") {
      return NextResponse.json(
        { error: "حساب شما توسط مدیریت بلیت‌مال مسدود شده است." },
        { status: 403 }
      );
    }

    const token = createSessionToken({
      userId: user.id,
      organizerId: user.myEventOrganizerId,
    });

    await setMyEventSessionCookie(token);

    return NextResponse.json({
      organizer: {
        id: user.myEventOrganizer.id,
        slug: user.myEventOrganizer.slug,
        displayName: user.myEventOrganizer.displayName,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در ورود";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
