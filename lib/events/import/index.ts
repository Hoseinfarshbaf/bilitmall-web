import type { EventFormData } from "@/lib/events/types";
import { EVENT_CATEGORIES } from "@/lib/events/types";
import { normalizeEventDays } from "@/lib/events/date-utils";
import { getCityNames } from "@/lib/cities";
import { downloadEventImageFromUrl } from "./download-image";
import { detectProvider, fetchEventPage } from "./fetch-page";
import { inferCategory } from "./map-category";
import { resolveCity } from "./map-city";
import { parseGenericPage } from "./providers/generic";
import { parseHonarticketPage } from "./providers/honarticket";
import { parseMelotikPage } from "./providers/melotik";
import type { ImportProvider, ImportQuestion, ImportResult, ParsedEventPartial } from "./types";

function computeConfidence(partial: ParsedEventPartial): number {
  let score = 0;
  if (partial.title) score += 25;
  if (partial.city) score += 15;
  if (partial.category) score += 10;
  if (partial.place) score += 15;
  if (partial.days?.length) score += 25;
  if (partial.imageUrl) score += 5;
  if (partial.price) score += 5;
  return Math.min(100, score);
}

function buildQuestions(
  partial: ParsedEventPartial,
  answers?: Record<string, string>
): ImportQuestion[] {
  const questions: ImportQuestion[] = [];

  const cityAnswer = answers?.city?.trim();
  if (!partial.city && !cityAnswer) {
    const options =
      partial.cityCandidates && partial.cityCandidates.length > 0
        ? partial.cityCandidates
        : [];
    if (options.length > 0) {
      questions.push({
        id: "city",
        label: "شهر رویداد را انتخاب کنید",
        type: "select",
        options: options.map((c) => ({ value: c, label: c })),
        required: true,
      });
    } else {
      questions.push({
        id: "city",
        label: "شهر رویداد را انتخاب کنید",
        type: "select",
        options: [],
        required: true,
      });
    }
  }

  const categoryAnswer = answers?.category?.trim();
  if (!partial.category && !categoryAnswer) {
    const options =
      partial.categoryCandidates && partial.categoryCandidates.length > 0
        ? partial.categoryCandidates
        : [...EVENT_CATEGORIES];
    if (options.length > 1) {
      questions.push({
        id: "category",
        label: "دسته رویداد را انتخاب کنید",
        type: "select",
        options: options.map((c) => ({ value: c, label: c })),
        required: true,
      });
    }
  }

  return questions;
}

function mergeAnswers(
  partial: ParsedEventPartial,
  answers?: Record<string, string>,
  cityNames?: string[]
): ParsedEventPartial {
  const merged = { ...partial };

  if (answers?.city) {
    merged.city = answers.city;
  } else if (!merged.city && cityNames) {
    const resolved = resolveCity(
      `${merged.title ?? ""} ${merged.place ?? ""} ${merged.placeAddress ?? ""}`,
      cityNames
    );
    merged.city = resolved.city;
    merged.cityCandidates = resolved.candidates;
  }

  if (answers?.category) {
    merged.category = answers.category;
  } else if (!merged.category) {
    const inferred = inferCategory(merged.title ?? "");
    merged.category = inferred.category;
    merged.categoryCandidates = inferred.candidates;
  }

  return merged;
}

function toDraft(
  partial: ParsedEventPartial,
  sourceUrl: string,
  localImage?: string | null
): EventFormData {
  const days = partial.days?.length
    ? normalizeEventDays(
        partial.days.map((day) => ({
          ...day,
          sessions: day.sessions.map((s) => ({
            ...s,
            purchaseUrl: s.purchaseUrl || sourceUrl,
          })),
        }))
      )
    : [];

  return {
    title: partial.title ?? "",
    city: partial.city ?? "",
    category: partial.category ?? "کنسرت",
    place: partial.place ?? "",
    placeAddress: partial.placeAddress ?? "",
    venueTemplateId: null,
    price: partial.price ?? "",
    image: localImage ?? "",
    bannerImage: "",
    badge: "",
    days,
    published: true,
    popular: false,
    featured: false,
    status: "active",
  };
}

export async function importEventFromUrl(
  rawUrl: string,
  answers?: Record<string, string>,
  options?: { provider?: ImportProvider | "auto" }
): Promise<ImportResult> {
  const warnings: string[] = [];
  const { html, finalUrl } = await fetchEventPage(rawUrl);
  const detected = detectProvider(finalUrl);
  const provider =
    options?.provider && options.provider !== "auto" ? options.provider : detected;

  let partial: ParsedEventPartial;
  switch (provider) {
    case "honarticket":
      partial = parseHonarticketPage(html, finalUrl);
      break;
    case "melotik":
      partial = parseMelotikPage(html, finalUrl);
      break;
    default:
      partial = parseGenericPage(html, finalUrl);
      break;
  }

  const cityNames = await getCityNames();
  partial = mergeAnswers(partial, answers, cityNames);

  if (!partial.title) {
    warnings.push("عنوان رویداد به‌طور خودکار شناسایی نشد.");
  }
  if (!partial.days?.length) {
    warnings.push("سانسی شناسایی نشد — بازه تاریخ را دستی در فرم انتخاب کنید.");
  }
  if (!partial.price) {
    warnings.push("قیمت شناسایی نشد — قبل از ذخیره قیمت را وارد کنید.");
  }

  let localImage: string | null = null;
  if (partial.imageUrl) {
    localImage = await downloadEventImageFromUrl(partial.imageUrl);
    if (!localImage) {
      warnings.push("کاور رویداد دانلود نشد — تصویر را دستی آپلود کنید.");
    }
  } else {
    warnings.push("تصویر کاور شناسایی نشد — تصویر را دستی آپلود کنید.");
  }

  const questions = buildQuestions(partial, answers);

  if (questions.some((q) => q.id === "city") && cityNames.length > 0) {
    const cityQ = questions.find((q) => q.id === "city");
    if (cityQ && cityQ.options.length === 0) {
      cityQ.options = cityNames.map((c) => ({ value: c, label: c }));
    }
  }

  const draft = toDraft(partial, finalUrl, localImage);
  const confidence = computeConfidence({ ...partial, imageUrl: localImage ?? partial.imageUrl });

  if (partial.price) {
    warnings.push("قیمت از صفحه مبدأ استخراج شد — در صورت نیاز اصلاح کنید.");
  }

  return {
    provider,
    confidence,
    draft,
    warnings,
    questions,
    sourceUrl: finalUrl,
  };
}
