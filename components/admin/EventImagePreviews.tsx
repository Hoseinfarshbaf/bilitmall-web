"use client";

import EventFramedImage from "@/components/EventFramedImage";
import {
  EVENT_BANNER_IMAGE,
  EVENT_CARD_IMAGE,
  SPECIAL_OFFERS_CAROUSEL,
} from "@/lib/events/image-specs";

type EventImagePreviewsProps = {
  imageUrl: string;
  title?: string;
  variant?: "card" | "banner" | "both";
};

export default function EventImagePreviews({
  imageUrl,
  title = "نام رویداد",
  variant = "both",
}: EventImagePreviewsProps) {
  if (!imageUrl) return null;

  const showCard = variant === "card" || variant === "both";
  const showBanner = variant === "banner" || variant === "both";

  return (
    <div
      className={
        showCard && showBanner
          ? "grid grid-cols-1 gap-4 lg:grid-cols-2"
          : "grid grid-cols-1 gap-4"
      }
    >
      {showCard ? (
        <div>
          <p className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            پیش‌نمایش کارت ({EVENT_CARD_IMAGE.aspectLabel})
          </p>
          <article className="relative mx-auto aspect-3/4 w-full max-w-[220px] overflow-hidden rounded-3xl bg-neutral-900 shadow-md">
            <EventFramedImage image={imageUrl} />
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h3 className="line-clamp-2 text-sm font-black text-white">{title}</h3>
            </div>
          </article>
        </div>
      ) : null}

      {showBanner ? (
        <div>
          <p className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            پیش‌نمایش بنر پیشنهاد ویژه ({EVENT_BANNER_IMAGE.aspectLabel})
          </p>
          <div
            className="relative w-full overflow-hidden rounded-[28px] bg-neutral-900 shadow-md"
            style={{
              aspectRatio: `${EVENT_BANNER_IMAGE.width} / ${EVENT_BANNER_IMAGE.height}`,
              maxHeight: `${SPECIAL_OFFERS_CAROUSEL.heightSmPx}px`,
            }}
          >
            <EventFramedImage variant="banner" image={imageUrl} />
            <div className="absolute inset-0 bg-linear-to-tl from-black/90 via-black/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
              <p className="line-clamp-2 text-sm font-black text-white sm:text-base">{title}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
