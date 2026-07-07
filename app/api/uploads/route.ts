import { NextResponse } from "next/server";
import { saveEventImage } from "@/lib/events/form-data";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "فایل تصویر ارسال نشده است." }, { status: 400 });
    }

    const url = await saveEventImage(file);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در آپلود تصویر.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
