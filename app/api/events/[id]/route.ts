import { NextResponse } from "next/server";
import {
  getEventById,
  removeEvent,
  updateEvent,
} from "@/lib/events";
import { applyUploadedImages, parseEventRequest, validateEventBannerImage, validateEventImage } from "@/lib/events/form-data";
import { validateEventFormBusinessRules } from "@/lib/events/pricing";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const event = await getEventById(Number(id));

  if (!event) {
    return NextResponse.json({ error: "رویداد یافت نشد." }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);
    const { form, imageFile, bannerImageFile } = await parseEventRequest(request);
    const body = await applyUploadedImages(form, imageFile, bannerImageFile);
    const existing = await getEventById(id);

    if (!existing) {
      return NextResponse.json({ error: "رویداد یافت نشد." }, { status: 404 });
    }

    const imageError = validateEventImage(body, imageFile, { isCreate: false });
    if (imageError) {
      return NextResponse.json({ error: imageError }, { status: 400 });
    }

    const bannerError = validateEventBannerImage(body, bannerImageFile, { isCreate: false });
    if (bannerError) {
      return NextResponse.json({ error: bannerError }, { status: 400 });
    }

    const businessError = validateEventFormBusinessRules(body);
    if (businessError) {
      return NextResponse.json({ error: businessError }, { status: 400 });
    }

    const event = await updateEvent(id, body);

    if (!event) {
      return NextResponse.json({ error: "رویداد یافت نشد." }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در ویرایش رویداد.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);
  const existing = await getEventById(id);

  if (!existing) {
    return NextResponse.json({ error: "رویداد یافت نشد." }, { status: 404 });
  }

  const deleted = await removeEvent(id);
  if (!deleted) {
    return NextResponse.json({ error: "رویداد یافت نشد." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
