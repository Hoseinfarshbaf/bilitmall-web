import { cityExists, getCitySlug } from "@/lib/cities/store";

const PERSIAN_TO_LATIN: Record<string, string> = {
  ا: "a",
  آ: "a",
  ب: "b",
  پ: "p",
  ت: "t",
  ث: "s",
  ج: "j",
  چ: "ch",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "z",
  ر: "r",
  ز: "z",
  ژ: "zh",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "z",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "gh",
  ک: "k",
  گ: "g",
  ل: "l",
  م: "m",
  ن: "n",
  و: "o",
  ه: "h",
  ی: "i",
  ئ: "y",
  ء: "",
  " ": " ",
  "‌": " ",
  "-": "-",
};

const CITY_SLUGS: Record<string, string> = {
  تهران: "tehran",
  اصفهان: "isfahan",
  شیراز: "shiraz",
  تبریز: "tabriz",
  مشهد: "mashhad",
  کیش: "kish",
  کرج: "karaj",
  اهواز: "ahvaz",
  رشت: "rasht",
  کرمان: "kerman",
};

const TITLE_STOP_WORDS = new Set([
  "concert",
  "konsert",
  "theater",
  "theatre",
  "teatr",
  "event",
  "live",
  "show",
  "کنسرت",
  "تئاتر",
  "ایونت",
  "نمایش",
  "اجرای",
  "برنامه",
]);

export function transliteratePersianToLatin(text: string): string {
  let result = "";
  const normalized = text.trim().normalize("NFC");

  for (const char of normalized) {
    if (PERSIAN_TO_LATIN[char] !== undefined) {
      result += PERSIAN_TO_LATIN[char];
      continue;
    }
    if (/[a-zA-Z0-9]/.test(char)) {
      result += char.toLowerCase();
      continue;
    }
    if (/\s/.test(char)) {
      result += " ";
    }
  }

  return result.replace(/\s+/g, " ").trim();
}

export function buildPublicCitySlug(city: string): string {
  const trimmed = city.trim();
  if (CITY_SLUGS[trimmed]) return CITY_SLUGS[trimmed];

  const latin = transliteratePersianToLatin(trimmed);
  const slug = latin
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "city";
}

export function buildPublicEventSlug(title: string): string {
  const latin = transliteratePersianToLatin(title);
  const tokens = latin
    .toLowerCase()
    .split(/[\s-]+/)
    .filter((token) => token && !TITLE_STOP_WORDS.has(token));

  const core = tokens.join("");
  const fallback = latin
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 48);

  const slug = (core || fallback || "event").replace(/[^a-z0-9]/g, "").slice(0, 48);
  return slug || "event";
}

export function buildMyEventPublicPath(publicEventSlug: string): string {
  return `/${publicEventSlug}`;
}

/** Normalize organizer-provided English link segment */
export function normalizePublicEventSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function isValidPublicEventSlug(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/.test(value);
}

export function resolvePublicSlugsForEvent(title: string, city: string): {
  publicEventSlug: string;
  publicCitySlug: string;
} {
  return {
    publicEventSlug: buildPublicEventSlug(title),
    publicCitySlug: buildPublicCitySlug(city),
  };
}

export async function buildPublicCitySlugAsync(city: string): Promise<string> {
  const trimmed = city.trim();
  const fromDb = await getCitySlug(trimmed);
  if (fromDb) return fromDb;
  return buildPublicCitySlug(trimmed);
}

export async function isKnownCity(city: string): Promise<boolean> {
  return cityExists(city.trim());
}
