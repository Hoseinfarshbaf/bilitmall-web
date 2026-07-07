"use client";

import { EVENT_BANNER_IMAGE, EVENT_CARD_IMAGE } from "@/lib/events/image-specs";
import { getEventBannerImageStyle, getEventImageStyle } from "@/lib/events/helpers";

type EventImagePreviewsProps = {
  imageUrl: string;
  title?: string;
};

export default function EventImagePreviews({
  imageUrl,
  title = "نام رویداد",
}: EventImagePreviewsProps) {
  if (!imageUrl) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-300">
          پیش‌نمایش کارت ({EVENT_CARD_IMAGE.aspectLabel})
        </p>
        <article className="relative mx-auto aspect-3/4 w-full max-w-[220px] overflow-hidden rounded-3xl bg-neutral-900 shadow-md">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={getEventImageStyle(imageUrl)}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="line-clamp-2 text-sm font-black text-white">{title}</h3>
          </div>
        </article>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-300">
          پیش‌نمایش بنر پیشنهاد ویژه ({EVENT_BANNER_IMAGE.aspectLabel})
        </p>
        <div className="relative h-36 w-full overflow-hidden rounded-[20px] bg-neutral-900 shadow-md sm:h-40">
          <div
            className="absolute inset-0 bg-cover"
            style={getEventBannerImageStyle(imageUrl)}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="line-clamp-1 text-sm font-black text-white">{title}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
