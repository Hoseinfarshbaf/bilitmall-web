import { NextResponse } from "next/server";
import {
  addUserFavorite,
  getUserFavoriteEventIds,
  getUserFavoriteEvents,
  removeUserFavorite,
} from "@/lib/bilitmall/favorites";
import { getBilitmallSession } from "@/lib/bilitmall/session";

export async function GET(request: Request) {
  const session = await getBilitmallSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("idsOnly") === "1") {
    const ids = await getUserFavoriteEventIds(session.userId);
    return NextResponse.json({ ids });
  }

  const events = await getUserFavoriteEvents(session.userId);
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const session = await getBilitmallSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { eventId?: unknown };
    const eventId = Number(body.eventId);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return NextResponse.json({ error: "شناسه رویداد نامعتبر است." }, { status: 400 });
    }

    await addUserFavorite(session.userId, eventId);
    return NextResponse.json({ ok: true, eventId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطا در ذخیره علاقه‌مندی" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getBilitmallSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = Number(searchParams.get("eventId"));
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "شناسه رویداد نامعتبر است." }, { status: 400 });
  }

  await removeUserFavorite(session.userId, eventId);
  return NextResponse.json({ ok: true, eventId });
}
