/** ابعاد نمایش بنر پیشنهاد ویژه در صفحه اصلی (SpecialOffers) */
export const SPECIAL_OFFERS_CAROUSEL = {
  maxWidthPx: 1152,
  heightPx: 288,
  heightSmPx: 320,
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

export const EVENT_CARD_IMAGE_RECOMMENDED_TEXT =
  `تصویر کارت به‌صورت خودکار به نسبت ${EVENT_CARD_IMAGE.aspectLabel} (${EVENT_CARD_IMAGE.width}×${EVENT_CARD_IMAGE.height}) برش و بهینه می‌شود. ترجیحاً ${EVENT_IMAGE_IDEAL_MIN_WIDTH}×${EVENT_IMAGE_IDEAL_MIN_HEIGHT} پیکسل؛ تا ${EVENT_IMAGE_SIZE_TOLERANCE_PX} پیکسل کمتر از هر بعد هم قابل قبول است.`;

export const EVENT_BANNER_IMAGE_RECOMMENDED_TEXT =
  `تصویر بنر به‌صورت خودکار به نسبت ${EVENT_BANNER_IMAGE.aspectLabel} (${EVENT_BANNER_IMAGE.width}×${EVENT_BANNER_IMAGE.height}) برش و در باکس کروسل پیشنهاد ویژه صفحه اصلی فیت می‌شود. حداقل ابعاد: ${EVENT_BANNER_MIN_WIDTH}×${EVENT_BANNER_MIN_HEIGHT} پیکسل.`;

/** @deprecated Use EVENT_CARD_IMAGE_RECOMMENDED_TEXT */
export const EVENT_IMAGE_RECOMMENDED_TEXT = EVENT_CARD_IMAGE_RECOMMENDED_TEXT;
