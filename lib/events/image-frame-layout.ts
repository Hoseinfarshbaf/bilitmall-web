import type { FrameTarget } from "./image-frame-types";

export type FrameLayoutMode = "cover" | "width" | "height";

export type FrameLayout = {
  mode: FrameLayoutMode;
  fgW: number;
  fgH: number;
  fgX: number;
  fgY: number;
};

/** نسبت نزدیک → cover؛ عریض‌تر → پر کردن عرض؛ بلندتر → پر کردن ارتفاع */
export function resolveFrameLayout(
  sourceWidth: number,
  sourceHeight: number,
  target: FrameTarget
): FrameLayout {
  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = target.width / target.height;
  const ratio = sourceAspect / targetAspect;

  if (ratio >= 0.9 && ratio <= 1.1) {
    return {
      mode: "cover",
      fgW: target.width,
      fgH: target.height,
      fgX: 0,
      fgY: 0,
    };
  }

  if (sourceAspect >= targetAspect) {
    const fgH = (sourceHeight * target.width) / sourceWidth;
    return {
      mode: "width",
      fgW: target.width,
      fgH,
      fgX: 0,
      fgY: (target.height - fgH) / 2,
    };
  }

  const fgW = (sourceWidth * target.height) / sourceHeight;
  return {
    mode: "height",
    fgW,
    fgH: target.height,
    fgX: (target.width - fgW) / 2,
    fgY: 0,
  };
}

/** @deprecated Use resolveFrameLayout */
export const resolveBannerLayout = resolveFrameLayout;

export function coverCropRect(
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
