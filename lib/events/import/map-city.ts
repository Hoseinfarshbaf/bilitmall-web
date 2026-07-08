import { DEFAULT_CITY_NAMES } from "@/lib/cities/constants";

export function findCitiesInText(
  text: string,
  cityNames: string[] = DEFAULT_CITY_NAMES
): string[] {
  const found: string[] = [];
  for (const city of cityNames) {
    if (city && text.includes(city)) found.push(city);
  }
  return [...new Set(found)];
}

export function resolveCity(
  text: string,
  cityNames: string[] = DEFAULT_CITY_NAMES
): { city?: string; candidates: string[] } {
  const matches = findCitiesInText(text, cityNames);
  if (matches.length === 1) return { city: matches[0], candidates: matches };
  if (matches.length > 1) return { candidates: matches };
  return { candidates: [] };
}
