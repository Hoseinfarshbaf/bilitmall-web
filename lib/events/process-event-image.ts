import {
  EVENT_BANNER_IMAGE,
  EVENT_BANNER_MIN_HEIGHT,
  EVENT_BANNER_MIN_WIDTH,
  EVENT_CARD_IMAGE,
  EVENT_IMAGE_IDEAL_MIN_HEIGHT,
  EVENT_IMAGE_IDEAL_MIN_WIDTH,
  EVENT_IMAGE_MIN_HEIGHT,
  EVENT_IMAGE_MIN_WIDTH,
} from "./image-specs";

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

function coverCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
) {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (sourceRatio > targetRatio) {
    cropWidth = sourceHeight * targetRatio;
    offsetX = (sourceWidth - cropWidth) / 2;
  } else {
    cropHeight = sourceWidth / targetRatio;
    offsetY = (sourceHeight - cropHeight) / 2;
  }

  return { cropWidth, cropHeight, offsetX, offsetY };
}

async function processImageToFile(
  file: File,
  target: { width: number; height: number },
  min: { width: number; height: number },
  suffix: string,
  tooSmallMessage: (min: { width: number; height: number }) => string
): Promise<File> {
  const image = await loadImageFromFile(file);

  const { cropWidth, cropHeight, offsetX, offsetY } = coverCrop(
    image.width,
    image.height,
    target.width,
    target.height
  );

  if (cropWidth < min.width || cropHeight < min.height) {
    throw new Error(tooSmallMessage(min));
  }

  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("پردازش تصویر در مرورگر ممکن نشد.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.drawImage(
    image,
    offsetX,
    offsetY,
    cropWidth,
    cropHeight,
    0,
    0,
    target.width,
    target.height
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
    (min) =>
      `ابعاد تصویر برای کارت بلیت‌مال کافی نیست. حداقل مؤثر پس از برش: ${min.width}×${min.height} پیکسل (ترجیحاً ${EVENT_IMAGE_IDEAL_MIN_WIDTH}×${EVENT_IMAGE_IDEAL_MIN_HEIGHT}).`
  );
}

export async function processEventBannerImageFile(file: File): Promise<File> {
  return processImageToFile(
    file,
    EVENT_BANNER_IMAGE,
    { width: EVENT_BANNER_MIN_WIDTH, height: EVENT_BANNER_MIN_HEIGHT },
    "banner",
    (min) => `حداقل ابعاد تصویر بنر ${min.width}×${min.height} پیکسل است.`
  );
}
