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

export const EVENT_IMAGE_MIN_WIDTH = 600;
export const EVENT_IMAGE_MIN_HEIGHT = 800;

export const EVENT_BANNER_MIN_WIDTH = 1000;
export const EVENT_BANNER_MIN_HEIGHT = 210;

export const EVENT_CARD_IMAGE_RECOMMENDED_TEXT =
  `تصویر کارت به‌صورت خودکار به نسبت ${EVENT_CARD_IMAGE.aspectLabel} (${EVENT_CARD_IMAGE.width}×${EVENT_CARD_IMAGE.height}) برش و بهینه می‌شود. حداقل ابعاد: ${EVENT_IMAGE_MIN_WIDTH}×${EVENT_IMAGE_MIN_HEIGHT} پیکسل.`;

export const EVENT_BANNER_IMAGE_RECOMMENDED_TEXT =
  `تصویر بنر به‌صورت خودکار به نسبت ${EVENT_BANNER_IMAGE.aspectLabel} (${EVENT_BANNER_IMAGE.width}×${EVENT_BANNER_IMAGE.height}) برش و در باکس کروسل پیشنهاد ویژه صفحه اصلی فیت می‌شود. حداقل ابعاد: ${EVENT_BANNER_MIN_WIDTH}×${EVENT_BANNER_MIN_HEIGHT} پیکسل.`;

/** @deprecated Use EVENT_CARD_IMAGE_RECOMMENDED_TEXT */
export const EVENT_IMAGE_RECOMMENDED_TEXT = EVENT_CARD_IMAGE_RECOMMENDED_TEXT;
