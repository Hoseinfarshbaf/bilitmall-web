import { getEventImageUrl } from "@/lib/events/helpers";
import {
  EVENT_IMAGE_FRAME_BLUR_BRIGHTNESS,
  EVENT_IMAGE_FRAME_BLUR_SATURATION,
  EVENT_IMAGE_FRAME_BACKGROUND,
} from "@/lib/events/image-specs";
import { cn } from "@/lib/utils";

type EventFramedImageProps = {
  image?: string | null;
  className?: string;
  variant?: "card" | "banner";
};

function BlurredBackdrop({ url }: { url: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `url(${url})`,
        backgroundSize: "cover",
        backgroundPosition: "center center",
        filter: `blur(52px) saturate(${EVENT_IMAGE_FRAME_BLUR_SATURATION}) brightness(${EVENT_IMAGE_FRAME_BLUR_BRIGHTNESS})`,
        transform: "scale(1.12)",
      }}
    />
  );
}

/** قاب ثابت — تصویر کامل با contain (بدون کات)؛ فضای خالی با بلور همان تصویر پر می‌شود */
export default function EventFramedImage({
  image,
  className,
}: EventFramedImageProps) {
  const url = getEventImageUrl(image);

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ backgroundColor: EVENT_IMAGE_FRAME_BACKGROUND }}
    >
      <BlurredBackdrop url={url} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        draggable={false}
        className="absolute inset-0 z-1 h-full w-full object-contain object-center"
      />
    </div>
  );
}
