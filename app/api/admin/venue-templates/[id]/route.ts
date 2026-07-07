import { NextResponse } from "next/server";
import { saveVenueTemplate } from "@/lib/seating/store";
import type { SeatingLayout } from "@/lib/seating/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const id = Number((await context.params).id);
  const body = (await request.json()) as {
    name?: string;
    slug?: string;
    city?: string;
    address?: string;
    isDefault?: boolean;
    layout?: SeatingLayout;
  };

  if (!body.name?.trim() || !body.layout) {
    return NextResponse.json({ error: "نام و نقشه سالن الزامی است." }, { status: 400 });
  }

  try {
    const saved = await saveVenueTemplate({
      id,
      name: body.name.trim(),
      slug: body.slug?.trim() ?? `venue-${id}`,
      city: body.city?.trim() ?? "",
      address: body.address?.trim() ?? "",
      isDefault: body.isDefault,
      layout: { ...body.layout, name: body.name.trim() },
    });

    return NextResponse.json({ id: saved.id, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ذخیره سالن ناموفق بود.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
