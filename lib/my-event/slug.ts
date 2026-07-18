import { isReservedBilitmallSubdomain } from "./domains";

export function normalizeMyEventSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function isValidMyEventSlug(slug: string): boolean {
  if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/.test(slug)) return false;
  if (isReservedBilitmallSubdomain(slug)) return false;
  return true;
}
