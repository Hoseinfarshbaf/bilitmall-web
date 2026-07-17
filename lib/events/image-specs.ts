/** ابعاد نمایش بنر پیشنهاد ویژه در صفحه اصلی (SpecialOffers) */
export const SPECIAL_OFFERS_CAROUSEL = {
  maxWidthPx: 1152,
  heightPx: 224,
  heightSmPx: 256,
} as const;

export const EVENT_CARD_IMAGE = {
  width: 900,
  height: 1200,
  aspectLabel: "۳:۴",
  label: "کارت رویداد",
} as const;

export const EVENT_BANNER_IMAGE = {
  width: 2000,
  height: 414,
  aspectLabel: "۲۰۰۰:۴۱۴",
  label: "بنر پیشنهاد ویژه",
} as const;

/** ابعاد پیشنهادی برای کیفیت بهتر */
export const EVENT_IMAGE_IDEAL_MIN_WIDTH = 600;
export const EVENT_IMAGE_IDEAL_MIN_HEIGHT = 800;

/** حاشیه انعطاف نسبت به حداقل پیشنهادی (هر بعد) */
export const EVENT_IMAGE_SIZE_TOLERANCE_PX = 200;

/** حداقل ابعاد مؤثر پس از برش مرکزی — کمتر از این رد می‌شود */
export const EVENT_IMAGE_MIN_WIDTH =
  EVENT_IMAGE_IDEAL_MIN_WIDTH - EVENT_IMAGE_SIZE_TOLERANCE_PX;
export const EVENT_IMAGE_MIN_HEIGHT =
  EVENT_IMAGE_IDEAL_MIN_HEIGHT - EVENT_IMAGE_SIZE_TOLERANCE_PX;

export const EVENT_BANNER_MIN_WIDTH = 1000;
export const EVENT_BANNER_MIN_HEIGHT = 210;

/** پس‌زمینه قاب کارت/بنر هنگام فیت contain */
export const EVENT_IMAGE_FRAME_BACKGROUND = "#171717" as const;

/** شدت محوی پس‌زمینه قاب (sharp sigma) */
export const EVENT_IMAGE_FRAME_BLUR_SIGMA = 42;

/** پاس دوم blur برای پخش نرم‌تر رنگ‌ها */
export const EVENT_IMAGE_FRAME_BLUR_SIGMA_FINE = 16;

/** بزرگ‌نمایی پس‌زمینه محو برای پوشش لبه‌های blur */
export const EVENT_IMAGE_FRAME_BLUR_OVERSCAN = 1.28;

/** اشباع و روشنایی لایه محو — رنگ زنده‌تر، نه تک‌رنگ تیره */
export const EVENT_IMAGE_FRAME_BLUR_SATURATION = 1.34;
export const EVENT_IMAGE_FRAME_BLUR_BRIGHTNESS = 1.05;

export const EVENT_CARD_IMAGE_RECOMMENDED_TEXT =
  `نسبت ${EVENT_CARD_IMAGE.aspectLabel} — تصویر بریده نمی‌شود. ترجیحاً ${EVENT_IMAGE_IDEAL_MIN_WIDTH}×${EVENT_IMAGE_IDEAL_MIN_HEIGHT} پیکسل (حداقل ${EVENT_IMAGE_MIN_WIDTH}×${EVENT_IMAGE_MIN_HEIGHT}).`;

export const EVENT_BANNER_IMAGE_RECOMMENDED_TEXT =
  `تصویر بنر در قاب ثابت ${EVENT_BANNER_IMAGE.aspectLabel} (${EVENT_BANNER_IMAGE.width}×${EVENT_BANNER_IMAGE.height}) قرار می‌گیرد؛ تصویر کامل بدون کات (contain) داخل قاب می‌نشیند و فضای خالی با رنگ محو خود تصویر پر می‌شود. حداقل ابعاد: ${EVENT_BANNER_MIN_WIDTH}×${EVENT_BANNER_MIN_HEIGHT} پیکسل.`;

/** @deprecated Use EVENT_CARD_IMAGE_RECOMMENDED_TEXT */
export const EVENT_IMAGE_RECOMMENDED_TEXT = EVENT_CARD_IMAGE_RECOMMENDED_TEXT;
