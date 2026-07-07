import { NextResponse } from "next/server";
import { createManagedEvent, getAllEvents } from "@/lib/events";
import { applyUploadedImage, parseEventRequest, validateEventImage } from "@/lib/events/form-data";

export async function GET() {
  const events = await getAllEvents();
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  try {
    const { form, imageFile } = await parseEventRequest(request);
    const body = await applyUploadedImage(form, imageFile);

    const imageError = validateEventImage(body, imageFile, { isCreate: true });
    if (imageError) {
      return NextResponse.json({ error: imageError }, { status: 400 });
    }

    if (!body.title?.trim() || !body.place?.trim() || !body.price?.trim()) {
      return NextResponse.json(
        { error: "عنوان، مکان و قیمت الزامی است." },
        { status: 400 }
      );
    }

    if (!body.days?.length) {
      return NextResponse.json(
        { error: "حداقل یک روز و سانس برای رویداد لازم است." },
        { status: 400 }
      );
    }

    const event = await createManagedEvent(body);
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در ثبت رویداد.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
