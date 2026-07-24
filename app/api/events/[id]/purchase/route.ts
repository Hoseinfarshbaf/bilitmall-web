import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBilitmallSession } from "@/lib/bilitmall/session";
import { formatPriceLabel } from "@/lib/seating/layout";
import { getEventSeatingPlan } from "@/lib/seating/store";
import { isInternalTicketing } from "@/lib/events/pricing";

type RouteContext = { params: Promise<{ id: string }> };

type PurchaseBody = {
  sessionDate?: string;
  sessionTime?: string;
  seatIds?: string[];
};

/**
 * خرید داخلی بلیت‌مال (رویدادهایی که ticketingType = INTERNAL دارند).
 * رویدادهای خارجی (هنرتیکت و …) از این مسیر استفاده نمی‌کنند.
 */
export async function POST(request: Request, context: RouteContext) {
  const eventId = Number((await context.params).id);
  if (!Number.isFinite(eventId)) {
    return NextResponse.json({ error: "شناسه رویداد نامعتبر است." }, { status: 400 });
  }

  const session = await getBilitmallSession();
  if (!session) {
    return NextResponse.json(
      { error: "برای پرداخت وارد حساب بلیت‌مال شوید.", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  let body: PurchaseBody;
  try {
    body = (await request.json()) as PurchaseBody;
  } catch {
    return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      published: true,
      status: true,
      ticketingType: true,
      hasAssignedSeating: true,
    },
  });

  if (!event || !event.published || event.status !== "active") {
    return NextResponse.json({ error: "رویداد یافت نشد." }, { status: 404 });
  }

  if (!isInternalTicketing(event.ticketingType as "INTERNAL" | "EXTERNAL_LINK")) {
    return NextResponse.json(
      { error: "خرید این رویداد از طریق سایت فروشنده انجام می‌شود." },
      { status: 400 }
    );
  }

  const seatIds = Array.isArray(body.seatIds)
    ? [...new Set(body.seatIds.filter((id) => typeof id === "string" && id.trim()))]
    : [];

  let amountRial = 0;
  let quantity = 1;
  let seatSummary = "";

  if (event.hasAssignedSeating) {
    if (seatIds.length === 0) {
      return NextResponse.json(
        { error: "حداقل یک صندلی انتخاب کنید." },
        { status: 400 }
      );
    }

    const plan = await getEventSeatingPlan(eventId);
    if (!plan) {
      return NextResponse.json(
        { error: "نقشه سالن برای این رویداد آماده نیست." },
        { status: 400 }
      );
    }

    const selected = plan.layout.cells.filter(
      (c) => seatIds.includes(c.id) && c.type === "seat" && c.available !== false
    );
    if (selected.length !== seatIds.length) {
      return NextResponse.json(
        { error: "برخی صندلی‌های انتخاب‌شده در دسترس نیستند." },
        { status: 400 }
      );
    }

    amountRial = selected.reduce((sum, c) => sum + (c.priceRial || 0), 0);
    quantity = selected.length;
    seatSummary = selected.map((c) => c.label || c.id).join("، ");
  } else {
    quantity = 1;
    const digits = event.price.replace(/\D/g, "");
    amountRial = digits ? Number(digits) : 0;
  }

  const paymentRef = `BM-${eventId}-${Date.now().toString(36).toUpperCase()}`;
  const amountLabel =
    amountRial > 0 ? formatPriceLabel(amountRial) : event.price || "رایگان";

  const order = await prisma.ticketOrder.create({
    data: {
      userId: session.userId,
      eventId: event.id,
      eventTitle: seatSummary
        ? `${event.title} (${seatSummary})`
        : event.title,
      eventSlug: event.slug,
      amount: amountLabel,
      amountRial,
      quantity,
      sessionDate: body.sessionDate?.trim() || null,
      sessionTime: body.sessionTime?.trim() || null,
      status: "paid",
      paymentRef,
      paymentMethod: "online",
    },
  });

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    paymentRef,
    amount: amountLabel,
    quantity,
    seatLabels: seatSummary || null,
  });
}
