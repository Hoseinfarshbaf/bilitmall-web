import type { EventFormData } from "@/lib/events/types";
import { EVENT_PRICE_EXTERNAL_LABEL } from "@/lib/events/pricing";
import { EVENT_CATEGORIES } from "@/lib/events/types";
import { normalizeEventDays } from "@/lib/events/date-utils";
import { getCityNames } from "@/lib/cities";
import { downloadEventBannerImageFromUrl, downloadEventImageFromUrl } from "./download-image";
import { detectProvider, fetchEventPage } from "./fetch-page";
import { extractEventAssetUrls } from "./extract-assets";
import { inferCategory } from "./map-category";
import { resolveCity } from "./map-city";
import { parseHonarticketPage } from "./providers/honarticket";
import {
  extractTiwallSaleUrl,
  parseTiwallPage,
  tiwallSellsExternally,
} from "./providers/tiwall";
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
      `${merged.placeAddress ?? ""} ${merged.place ?? ""}`,
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
  localImage?: string | null,
  localBanner?: string | null
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
    image: localImage ?? "",
    bannerImage: localBanner ?? "",
    badge: "",
    days,
    published: true,
    popular: false,
    featured: false,
    status: "active",
    ticketingType: "EXTERNAL_LINK",
    hasAssignedSeating: false,
    pricingMode: null,
    fixedPriceAmount: "",
    price: partial.price?.trim() || EVENT_PRICE_EXTERNAL_LABEL,
  };
}

export async function importEventFromUrl(
  rawUrl: string,
  answers?: Record<string, string>,
  options?: { provider?: ImportProvider | "auto" }
): Promise<ImportResult> {
  const warnings: string[] = [];
  const cityNames = await getCityNames();
  const { html, finalUrl } = await fetchEventPage(rawUrl);
  const detected = detectProvider(finalUrl);
  const provider: ImportProvider =
    options?.provider && options.provider !== "auto" ? options.provider : detected;

  if (provider !== "honarticket" && provider !== "tiwall") {
    throw new Error("فقط لینک‌های هنر تیکت و تیوال پشتیبانی می‌شوند.");
  }

  let partial =
    provider === "honarticket"
      ? parseHonarticketPage(html, finalUrl)
      : parseTiwallPage(html, finalUrl, undefined, cityNames);

  if (provider === "tiwall") {
    const saleUrl = extractTiwallSaleUrl(html, finalUrl);
    if (saleUrl) {
      try {
        const { html: saleHtml } = await fetchEventPage(saleUrl);
        partial = parseTiwallPage(html, finalUrl, saleHtml, cityNames);
      } catch {
        // Keep event-page parsing if the sale page cannot be fetched.
      }
    }
  }

  const assets = extractEventAssetUrls(html, finalUrl);
  const mergedPartial = mergeAnswers(partial, answers, cityNames);

  if (!mergedPartial.title) {
    warnings.push("عنوان رویداد به‌طور خودکار شناسایی نشد.");
  }
  if (!mergedPartial.days?.length) {
    warnings.push("سانسی شناسایی نشد — بازه تاریخ را دستی در فرم انتخاب کنید.");
  }
  if (provider === "tiwall" && tiwallSellsExternally(html)) {
    warnings.push(
      "فروش بلیت این رویداد روی سایت دیگری انجام می‌شود — در صورت نیاز لینک هنر تیکت را هم بررسی کنید."
    );
  }
  if (!mergedPartial.price) {
    warnings.push("قیمت شناسایی نشد — قبل از ذخیره قیمت را وارد کنید.");
  }

  let localImage: string | null = null;
  const cardImageUrl = mergedPartial.imageUrl ?? assets.cardImageUrl;
  if (cardImageUrl) {
    localImage = await downloadEventImageFromUrl(cardImageUrl);
    if (!localImage) {
      warnings.push("کاور رویداد دانلود نشد — تصویر را دستی آپلود کنید.");
    }
  } else {
    warnings.push("تصویر کاور شناسایی نشد — تصویر را دستی آپلود کنید.");
  }

  let localBanner: string | null = null;
  if (assets.bannerImageUrl) {
    localBanner = await downloadEventBannerImageFromUrl(assets.bannerImageUrl);
    if (!localBanner) {
      warnings.push("بنر افقی دانلود نشد — برای پیشنهاد ویژه تصویر بنر را دستی آپلود کنید.");
    }
  } else {
    warnings.push("بنر افقی شناسایی نشد — برای پیشنهاد ویژه تصویر بنر را دستی آپلود کنید.");
  }

  const questions = buildQuestions(mergedPartial, answers);

  if (questions.some((q) => q.id === "city") && cityNames.length > 0) {
    const cityQ = questions.find((q) => q.id === "city");
    if (cityQ && cityQ.options.length === 0) {
      cityQ.options = cityNames.map((c) => ({ value: c, label: c }));
    }
  }

  const draft = toDraft(mergedPartial, finalUrl, localImage, localBanner);
  const confidence = computeConfidence({
    ...mergedPartial,
    imageUrl: localImage ?? mergedPartial.imageUrl,
  });

  if (mergedPartial.price) {
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
