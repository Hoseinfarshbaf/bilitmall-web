import { NextResponse } from "next/server";
import { getBilitmallSession } from "@/lib/bilitmall/session";
import { getUserOrders } from "@/lib/bilitmall/store";

export async function GET() {
  const session = await getBilitmallSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await getUserOrders(session.userId);
  return NextResponse.json(orders);
}
