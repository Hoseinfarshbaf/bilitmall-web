import { NextResponse } from "next/server";
import { getMyEventSession } from "@/lib/my-event/session";
import { getSessionMyEventOrganizer } from "@/lib/my-event/store";
import { getVenueTemplateById } from "@/lib/seating/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getMyEventSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getSessionMyEventOrganizer(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templateId = Number((await context.params).id);
  if (!Number.isFinite(templateId) || templateId <= 0) {
    return NextResponse.json({ error: "سالن نامعتبر است." }, { status: 400 });
  }

  const template = await getVenueTemplateById(templateId);
  if (!template) {
    return NextResponse.json({ error: "سالن یافت نشد." }, { status: 404 });
  }

  return NextResponse.json({
    id: template.id,
    name: template.name,
    city: template.city,
    address: template.address,
    layout: template.layout,
    readOnly: true,
  });
}
