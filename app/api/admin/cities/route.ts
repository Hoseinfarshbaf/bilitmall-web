import { NextResponse } from "next/server";
import { createCity, deleteCity, listCitiesWithUsage } from "@/lib/cities/store";

export async function GET() {
  try {
    const cities = await listCitiesWithUsage();
    return NextResponse.json(cities);
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در بارگذاری شهرها";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; isPopular?: boolean };
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "نام شهر الزامی است." }, { status: 400 });
    }
    const city = await createCity(body.name, { isPopular: body.isPopular });
    return NextResponse.json(city, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در افزودن شهر";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "شناسه شهر نامعتبر است." }, { status: 400 });
    }
    await deleteCity(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در حذف شهر";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
