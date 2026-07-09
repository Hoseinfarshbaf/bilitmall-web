import { NextResponse } from "next/server";
import { listCitiesWithEventCount } from "@/lib/cities/store";

export async function GET() {
  try {
    const cities = await listCitiesWithEventCount({ onlyWithEvents: true });
    return NextResponse.json(cities);
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در بارگذاری شهرها";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
