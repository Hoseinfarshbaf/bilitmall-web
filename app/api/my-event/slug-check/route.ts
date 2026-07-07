import { NextResponse } from "next/server";
import { isValidMyEventSlug, normalizeMyEventSlug } from "@/lib/my-event/auth";
import { isMyEventSlugTaken } from "@/lib/my-event/store";

/** Check whether an organizer page slug (e.g. coferoze) is available */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = normalizeMyEventSlug(searchParams.get("slug") ?? "");
  const excludeId = Number(searchParams.get("excludeOrganizerId") ?? "");

  if (!slug) {
    return NextResponse.json({ slug: "", available: false, valid: false });
  }

  const valid = isValidMyEventSlug(slug);
  if (!valid) {
    return NextResponse.json({ slug, available: false, valid: false });
  }

  const taken = await isMyEventSlugTaken(
    slug,
    Number.isFinite(excludeId) && excludeId > 0 ? excludeId : undefined
  );

  return NextResponse.json({ slug, available: !taken, valid: true });
}
