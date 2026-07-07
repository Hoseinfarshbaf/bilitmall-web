import { NextResponse } from "next/server";
import {
  listOrganizerSeatingPlans,
  type OrganizerPlanFilters,
} from "@/lib/seating/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: OrganizerPlanFilters = {
      q: searchParams.get("q") ?? undefined,
      city: searchParams.get("city") ?? undefined,
      organizer: searchParams.get("organizer") ?? undefined,
    };
    const plans = await listOrganizerSeatingPlans(filters);
    return NextResponse.json(plans);
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در بارگذاری سالن‌های برگزارکننده";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
