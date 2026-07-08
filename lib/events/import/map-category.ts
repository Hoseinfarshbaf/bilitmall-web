import { EVENT_CATEGORIES } from "@/lib/events/types";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  کنسرت: ["کنسرت", "concert", "موسیقی", "خواننده", "گروه"],
  تئاتر: ["تئاتر", "theater", "theatre", "نمایش", "کمدی", "درام", "اجرا"],
  ایونت: ["ایونت", "event", "همایش", "جشنواره", "سیرک", "ورزش", "پخش زنده"],
};

export function inferCategory(text: string): {
  category?: string;
  candidates: string[];
} {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const cat of EVENT_CATEGORIES) {
    scores[cat] = 0;
    for (const kw of CATEGORY_KEYWORDS[cat] ?? []) {
      if (lower.includes(kw.toLowerCase())) scores[cat] += 1;
    }
  }

  const ranked = EVENT_CATEGORIES.filter((c) => scores[c] > 0).sort(
    (a, b) => scores[b] - scores[a]
  );

  if (ranked.length === 0) {
    return { candidates: [...EVENT_CATEGORIES] };
  }

  if (ranked.length === 1 || scores[ranked[0]] > scores[ranked[1]]) {
    return { category: ranked[0], candidates: ranked };
  }

  return { category: ranked[0], candidates: ranked.slice(0, 2) };
}
