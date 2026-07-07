export const EVENT_CARD_IMAGE = {
  width: 900,
  height: 1200,
  aspectLabel: "۳:۴",
  label: "کارت رویداد",
} as const;

export const EVENT_BANNER_IMAGE = {
  width: 1440,
  height: 400,
  aspectLabel: "۱۴:۴",
  label: "بنر پیشنهاد ویژه",
} as const;

export const EVENT_IMAGE_MIN_WIDTH = 600;
export const EVENT_IMAGE_MIN_HEIGHT = 800;

export const EVENT_IMAGE_RECOMMENDED_TEXT =
  `تصویر به‌صورت خودکار به نسبت ${EVENT_CARD_IMAGE.aspectLabel} (${EVENT_CARD_IMAGE.width}×${EVENT_CARD_IMAGE.height}) برش و بهینه می‌شود. حداقل ابعاد: ${EVENT_IMAGE_MIN_WIDTH}×${EVENT_IMAGE_MIN_HEIGHT} پیکسل.`;
