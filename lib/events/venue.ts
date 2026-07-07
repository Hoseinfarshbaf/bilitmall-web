import { getVenueTemplateById } from "@/lib/seating/store";

export async function resolveEventPlaceAddress(
  venueTemplateId: number | null | undefined,
  placeAddress?: string
): Promise<string | null> {
  const trimmed = placeAddress?.trim();
  if (trimmed) return trimmed;
  if (!venueTemplateId) return null;
  const template = await getVenueTemplateById(venueTemplateId);
  return template?.address?.trim() || null;
}
