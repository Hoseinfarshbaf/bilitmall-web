import { NextResponse } from "next/server";
import { createCity } from "@/lib/cities/store";
import { getMyEventSession } from "@/lib/my-event/session";
import { getSessionMyEventOrganizer } from "@/lib/my-event/store";

export async function POST(request: Request) {
  const session = await getMyEventSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getSessionMyEventOrganizer(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.myEventOrganizer.status === "suspended") {
    return NextResponse.json({ error: "حساب مسدود است." }, { status: 403 });
  }

  if (user.myEventOrganizer.status !== "active") {
    return NextResponse.json(
      {
        error:
          "حساب شما هنوز توسط ادمین تأیید نشده است. پس از تأیید می‌توانید شهر جدید ثبت کنید.",
      },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as { name?: string };
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "نام شهر الزامی است." }, { status: 400 });
    }

    const city = await createCity(body.name);
    return NextResponse.json(city, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در افزودن شهر";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
