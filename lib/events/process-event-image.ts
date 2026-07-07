import {
  EVENT_CARD_IMAGE,
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

export async function processEventImageFile(file: File): Promise<File> {
  const image = await loadImageFromFile(file);

  if (image.width < EVENT_IMAGE_MIN_WIDTH || image.height < EVENT_IMAGE_MIN_HEIGHT) {
    throw new Error(
      `حداقل ابعاد تصویر ${EVENT_IMAGE_MIN_WIDTH}×${EVENT_IMAGE_MIN_HEIGHT} پیکسل است.`
    );
  }

  const canvas = document.createElement("canvas");
  canvas.width = EVENT_CARD_IMAGE.width;
  canvas.height = EVENT_CARD_IMAGE.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("پردازش تصویر در مرورگر ممکن نشد.");
  }

  const { cropWidth, cropHeight, offsetX, offsetY } = coverCrop(
    image.width,
    image.height,
    EVENT_CARD_IMAGE.width,
    EVENT_CARD_IMAGE.height
  );

  context.drawImage(
    image,
    offsetX,
    offsetY,
    cropWidth,
    cropHeight,
    0,
    0,
    EVENT_CARD_IMAGE.width,
    EVENT_CARD_IMAGE.height
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
  return new File([blob], `${baseName}-cover.jpg`, { type: "image/jpeg" });
}
