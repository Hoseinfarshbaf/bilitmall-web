import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEventSeatingPlan } from "@/lib/seating/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const eventId = Number((await context.params).id);
  if (!Number.isFinite(eventId)) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, published: true, status: true, hasAssignedSeating: true },
  });

  if (!event || !event.published || event.status !== "active") {
    return NextResponse.json({ error: "رویداد یافت نشد." }, { status: 404 });
  }

  if (!event.hasAssignedSeating) {
    return NextResponse.json({ hasSeatingPlan: false, layout: null });
  }

  const plan = await getEventSeatingPlan(eventId);
  if (!plan) {
    return NextResponse.json({ hasSeatingPlan: false, layout: null });
  }

  return NextResponse.json({
    hasSeatingPlan: true,
    name: plan.name,
    layout: plan.layout,
  });
}
