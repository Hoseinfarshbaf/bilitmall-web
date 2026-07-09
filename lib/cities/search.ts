/** نرمال‌سازی حروف فارسی/عربی برای جستجوی روان شهر */
export function normalizeCitySearch(text: string): string {
  return text
    .replace(/\u200c/g, " ")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .trim()
    .toLowerCase();
}

export function filterCitiesBySearch(cities: string[], query: string): string[] {
  const q = normalizeCitySearch(query);
  if (!q) return cities;

  const starts: string[] = [];
  const contains: string[] = [];
  for (const city of cities) {
    const normalized = normalizeCitySearch(city);
    if (normalized.startsWith(q)) starts.push(city);
    else if (normalized.includes(q)) contains.push(city);
  }
  return [...starts, ...contains];
}
