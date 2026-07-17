import type { ImageFrameFit } from "./composite-image-frame";
import {
  EVENT_BANNER_IMAGE,
  EVENT_BANNER_MIN_HEIGHT,
  EVENT_BANNER_MIN_WIDTH,
  EVENT_CARD_IMAGE,
  EVENT_IMAGE_FRAME_BLUR_BRIGHTNESS,
  EVENT_IMAGE_FRAME_BLUR_OVERSCAN,
  EVENT_IMAGE_FRAME_BLUR_SATURATION,
  EVENT_IMAGE_IDEAL_MIN_HEIGHT,
  EVENT_IMAGE_IDEAL_MIN_WIDTH,
  EVENT_IMAGE_MIN_HEIGHT,
  EVENT_IMAGE_MIN_WIDTH,
} from "./image-specs";
import { resolveFrameLayout } from "./image-frame-layout";

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("خواندن تصویر ممکن نشد."));
    };

    image.src = url;
  });
}

function drawBlurredCoverBackground(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
) {
  const coverScale =
    Math.max(targetWidth / image.width, targetHeight / image.height) *
    EVENT_IMAGE_FRAME_BLUR_OVERSCAN;
  const drawWidth = image.width * coverScale;
  const drawHeight = image.height * coverScale;
  const offsetX = (targetWidth - drawWidth) / 2;
  const offsetY = (targetHeight - drawHeight) / 2;

  context.save();
  context.filter = `blur(44px) saturate(${EVENT_IMAGE_FRAME_BLUR_SATURATION}) brightness(${EVENT_IMAGE_FRAME_BLUR_BRIGHTNESS})`;
  context.drawImage(
    image,
    0,
    0,
    image.width,
    image.height,
    offsetX,
    offsetY,
    drawWidth,
    drawHeight
  );
  context.filter = "blur(18px)";
  context.drawImage(
    image,
    0,
    0,
    image.width,
    image.height,
    offsetX,
    offsetY,
    drawWidth,
    drawHeight
  );
  context.restore();
}

async function processImageToFile(
  file: File,
  target: { width: number; height: number },
  min: { width: number; height: number },
  suffix: string,
  _fit: ImageFrameFit,
  tooSmallMessage: (min: { width: number; height: number }) => string
): Promise<File> {
  const image = await loadImageFromFile(file);
  const layout = resolveFrameLayout(image.width, image.height, target);

  if (layout.fgW < min.width || layout.fgH < min.height) {
    throw new Error(tooSmallMessage(min));
  }

  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("پردازش تصویر در مرورگر ممکن نشد.");
  }

  drawBlurredCoverBackground(context, image, target.width, target.height);

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  // همیشه contain — کل تصویر بدون کات
  context.drawImage(
    image,
    0,
    0,
    image.width,
    image.height,
    layout.fgX,
    layout.fgY,
    layout.fgW,
    layout.fgH
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("تبدیل تصویر انجام نشد."));
          return;
        }
        resolve(result);
      },
      "image/jpeg",
      0.92
    );
  });

  const baseName = file.name.replace(/\.[^.]+$/, "") || "event";
  return new File([blob], `${baseName}-${suffix}.jpg`, { type: "image/jpeg" });
}

export async function processEventImageFile(file: File): Promise<File> {
  return processImageToFile(
    file,
    EVENT_CARD_IMAGE,
    { width: EVENT_IMAGE_MIN_WIDTH, height: EVENT_IMAGE_MIN_HEIGHT },
    "card",
    "card",
    (min) =>
      `ابعاد تصویر برای کارت بلیت‌مال کافی نیست. حداقل مؤثر در قاب: ${min.width}×${min.height} پیکسل (ترجیحاً ${EVENT_IMAGE_IDEAL_MIN_WIDTH}×${EVENT_IMAGE_IDEAL_MIN_HEIGHT}).`
  );
}

export async function processEventBannerImageFile(file: File): Promise<File> {
  return processImageToFile(
    file,
    EVENT_BANNER_IMAGE,
    { width: EVENT_BANNER_MIN_WIDTH, height: EVENT_BANNER_MIN_HEIGHT },
    "banner",
    "banner",
    (min) => `حداقل ابعاد تصویر بنر در قاب ${min.width}×${min.height} پیکسل است.`
  );
}
