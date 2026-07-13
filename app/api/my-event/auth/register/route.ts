import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  isValidMyEventSlug,
  normalizeMyEventSlug,
} from "@/lib/my-event/auth";
import { isValidIranMobile, normalizePhone } from "@/lib/auth/phone";
import { MY_EVENT_REGISTRATION_SUCCESS_MESSAGE } from "@/lib/my-event/constants";
import { isMyEventSlugTaken } from "@/lib/my-event/store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      phone?: string;
      password?: string;
      displayName?: string;
      slug?: string;
    };

    const name = body.name?.trim() ?? "";
    const phone = normalizePhone(body.phone ?? "");
    const password = body.password ?? "";
    const displayName = body.displayName?.trim() ?? "";
    const slug = normalizeMyEventSlug(body.slug ?? displayName);

    if (!name || !phone || !password || !displayName) {
      return NextResponse.json(
        { error: "نام، موبایل، رمز و نام برند الزامی است." },
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

    if (!isValidMyEventSlug(slug)) {
      return NextResponse.json(
        { error: "آدرس صفحه فقط حروف انگلیسی کوچک، عدد و خط تیره باشد." },
        { status: 400 }
      );
    }

    if (await isMyEventSlugTaken(slug)) {
      return NextResponse.json(
        { error: "این آدرس صفحه قبلاً ثبت شده است." },
        { status: 409 }
      );
    }

    const existingUser = await prisma.myEventUser.findUnique({ where: { phone } });
    if (existingUser) {
      return NextResponse.json(
        { error: "این شماره موبایل قبلاً ثبت شده است." },
        { status: 409 }
      );
    }

    await prisma.myEventOrganizer.create({
      data: {
        slug,
        displayName,
        phone,
        status: "pending",
        users: {
          create: {
            phone,
            name,
            passwordHash: hashPassword(password),
            role: "owner",
          },
        },
      },
      include: { users: true },
    });

    return NextResponse.json({
      success: true,
      message: MY_EVENT_REGISTRATION_SUCCESS_MESSAGE,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در ثبت‌نام";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
