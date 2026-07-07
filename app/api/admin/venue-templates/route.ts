import { NextResponse } from "next/server";
import { createEmptyLayout } from "@/lib/seating/layout";
import {
  deleteVenueTemplate,
  listAdminVenueTemplates,
  saveVenueTemplate,
  type VenueListFilters,
} from "@/lib/seating/store";
import { slugify } from "@/lib/events/date-utils";
import { prisma } from "@/lib/prisma";
import type { SeatingLayout } from "@/lib/seating/types";

async function resolveVenueSlug(name: string, city: string, requested?: string): Promise<string> {
  const fromRequest = requested?.trim() ? slugify(requested) : "";
  let base = fromRequest || slugify(`${name}-${city}`) || slugify(name);
  if (!base) base = `venue-${Date.now()}`;
  let slug = base;
  let counter = 1;
  while (await prisma.venueTemplate.findUnique({ where: { slug } })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: VenueListFilters = {
      q: searchParams.get("q") ?? undefined,
      city: searchParams.get("city") ?? undefined,
    };
    const templates = await listAdminVenueTemplates(filters);
    return NextResponse.json(templates);
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در بارگذاری سالن‌ها";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    slug?: string;
    city?: string;
    address?: string;
    isDefault?: boolean;
    layout?: SeatingLayout;
  };

  const name = body.name?.trim();
  const city = body.city?.trim();
  const address = body.address?.trim() ?? "";
  if (!name || !city) {
    return NextResponse.json({ error: "نام و شهر سالن الزامی است." }, { status: 400 });
  }

  const layout = body.layout ?? createEmptyLayout(name, 8, 12);

  try {
    const slug = await resolveVenueSlug(name, city, body.slug);
    const saved = await saveVenueTemplate({
      name,
      slug,
      city,
      address,
      layout: { ...layout, name },
      source: "admin",
    });
    return NextResponse.json({ id: saved.id, success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ذخیره سالن ناموفق بود.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "شناسه الزامی است." }, { status: 400 });
  }
  try {
    await deleteVenueTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "حذف سالن ناموفق بود.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
