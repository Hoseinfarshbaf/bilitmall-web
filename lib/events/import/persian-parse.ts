import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { normalizeDateString, normalizeTimeString, toLatinDigits } from "@/lib/events/date-utils";

const PERSIAN_MONTHS: Record<string, number> = {
  فروردین: 1,
  اردیبهشت: 2,
  خرداد: 3,
  تیر: 4,
  مرداد: 5,
  شهریور: 6,
  شهريور: 6,
  مهر: 7,
  آبان: 8,
  آذر: 9,
  دی: 10,
  بهمن: 11,
  اسفند: 12,
};

export function extractTimes(text: string): string[] {
  const latin = toLatinDigits(text);
  const matches = latin.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g) ?? [];
  return [...new Set(matches.map((t) => normalizeTimeString(t)))];
}

export function parsePersianDateFromText(text: string): string | null {
  const latin = toLatinDigits(text).replace(/-/g, "/");

  const slashMatch = latin.match(/(14\d{2})\/(\d{1,2})\/(\d{1,2})/);
  if (slashMatch) {
    return normalizeDateString(slashMatch[0]);
  }

  for (const [monthName, monthNum] of Object.entries(PERSIAN_MONTHS)) {
    const pattern = new RegExp(
      `(\\d{1,2})\\s+${monthName}(?:\\s+(14\\d{2}))?`,
      "i"
    );
    const match = latin.match(pattern);
    if (!match) continue;

    const day = match[1].padStart(2, "0");
    const year = match[2] ?? String(new DateObject({ calendar: persian }).year);
    return normalizeDateString(`${year}/${monthNum}/${day}`);
  }

  const weekdayPattern =
    /(?:شنبه|یکشنبه|دوشنبه|سه‌شنبه|سه شنبه|چهارشنبه|پنجشنبه|جمعه)[،,\s]+(\d{1,2})\s+(\S+?)(?:\s+(14\d{2}))?/i;
  const weekdayMatch = latin.match(weekdayPattern);
  if (weekdayMatch) {
    const day = weekdayMatch[1];
    const monthToken = weekdayMatch[2].replace(/\s/g, "");
    const year = weekdayMatch[3];
    const monthNum = PERSIAN_MONTHS[monthToken];
    if (monthNum) {
      const y = year ?? String(new DateObject({ calendar: persian }).year);
      return normalizeDateString(`${y}/${monthNum}/${day.padStart(2, "0")}`);
    }
  }

  try {
    const d = new DateObject({
      date: text.trim(),
      calendar: persian,
      locale: persian_fa,
    });
    if (d.isValid) return d.format("YYYY/MM/DD");
  } catch {
    // fall through
  }

  return null;
}

export function extractMinPriceToman(text: string): string | null {
  const latin = toLatinDigits(text);
  const prices: number[] = [];

  const commaPrices = latin.match(/(\d{1,3}(?:,\d{3})+)\s*تومان/g) ?? [];
  for (const p of commaPrices) {
    const num = Number(p.replace(/[^\d]/g, ""));
    if (Number.isFinite(num) && num > 0) prices.push(num);
  }

  const plainPrices = latin.match(/(\d{5,})\s*تومان/g) ?? [];
  for (const p of plainPrices) {
    const num = Number(p.replace(/[^\d]/g, ""));
    if (Number.isFinite(num) && num > 0) prices.push(num);
  }

  if (prices.length === 0) return null;
  const min = Math.min(...prices);
  return `${min.toLocaleString("fa-IR")} تومان`;
}
