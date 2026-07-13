import { getEventImageUrl } from "@/lib/events/helpers";
import {
  EVENT_IMAGE_FRAME_BLUR_BRIGHTNESS,
  EVENT_IMAGE_FRAME_BLUR_SATURATION,
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

/** قاب ثابت پر از تصویر — کارت ۳:۴ یا بنر پیشنهاد ویژه */
export default function EventFramedImage({
  image,
  className,
}: EventFramedImageProps) {
  const url = getEventImageUrl(image);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <BlurredBackdrop url={url} />
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${url})` }}
        role="img"
        aria-hidden
      />
    </div>
  );
}
