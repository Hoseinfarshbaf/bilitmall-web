import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getEventSeatingPlan,
  getVenueTemplateById,
} from "@/lib/seating/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const eventId = Number((await context.params).id);
  if (!Number.isFinite(eventId)) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      published: true,
      status: true,
      hasAssignedSeating: true,
      venueTemplateId: true,
    },
  });

  if (!event || !event.published || event.status !== "active") {
    return NextResponse.json({ error: "رویداد یافت نشد." }, { status: 404 });
  }

  if (!event.hasAssignedSeating) {
    return NextResponse.json({ hasSeatingPlan: false, layout: null });
  }

  const plan = await getEventSeatingPlan(eventId);
  if (plan) {
    return NextResponse.json({
      hasSeatingPlan: true,
      name: plan.name,
      layout: plan.layout,
    });
  }

  // Fallback: layout from linked venue template (not yet copied to EventSeatingPlan).
  if (event.venueTemplateId) {
    const template = await getVenueTemplateById(event.venueTemplateId);
    if (template?.layout) {
      return NextResponse.json({
        hasSeatingPlan: true,
        name: template.name,
        layout: { ...template.layout, name: template.name },
      });
    }
  }

  return NextResponse.json({ hasSeatingPlan: false, layout: null });
}
