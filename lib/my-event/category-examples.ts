import type { MyEventCategory } from "./categories";

export type CategoryFormExamples = {
  title: string;
  publicEventSlug: string;
  place: string;
  price: string;
  description: string;
  titleHint: string;
};

export const CATEGORY_FORM_EXAMPLES: Record<MyEventCategory, CategoryFormExamples> = {
  کنسرت: {
    title: "کنسرت محسن یگانه",
    publicEventSlug: "mohsenyeganeh",
    place: "سالن میلاد نمایشگاه‌های بین‌المللی",
    price: "از ۳۵۰ هزار تومان",
    description:
      "اجرای زنده با همراهی گروه موسیقی؛ ورود به سالن از ۳۰ دقیقه قبل از شروع مجاز است.",
    titleHint: "نام خواننده یا گروه را در عنوان بیاورید.",
  },
  تئاتر: {
    title: "نمایش شب‌های روشن",
    publicEventSlug: "shabhayeroshan",
    place: "تالار وحدت",
    price: "از ۲۲۰ هزار تومان",
    description:
      "نمایش داستانی با کارگردانی ...؛ مدت اجرا حدود ۹۰ دقیقه بدون فاصله.",
    titleHint: "نام نمایش یا نویسنده را در عنوان بنویسید.",
  },
  ایونت: {
    title: "ورکشاپ برندسازی شخصی",
    publicEventSlug: "personalbranding",
    place: "فضای رویداد آزادی",
    price: "از ۱۸۰ هزار تومان",
    description:
      "کارگاه عملی با پذیرایی و گواهی حضور؛ ظرفیت محدود و ثبت‌نام زودهنگام.",
    titleHint: "موضوع یا نام برگزارکننده رویداد را مشخص کنید.",
  },
};

export function getCategoryExamples(category: string): CategoryFormExamples | null {
  if (category in CATEGORY_FORM_EXAMPLES) {
    return CATEGORY_FORM_EXAMPLES[category as MyEventCategory];
  }
  return null;
}
