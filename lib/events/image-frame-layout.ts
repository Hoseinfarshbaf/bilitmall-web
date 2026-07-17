import type { FrameTarget } from "./image-frame-types";

export type FrameLayoutMode = "width" | "height";

export type FrameLayout = {
  mode: FrameLayoutMode;
  fgW: number;
  fgH: number;
  fgX: number;
  fgY: number;
};

/**
 * همیشه contain — تصویر کامل داخل قاب، بدون کات.
 * عریض‌تر → عرض قاب را پر می‌کند؛ بلندتر → ارتفاع قاب را.
 */
export function resolveFrameLayout(
  sourceWidth: number,
  sourceHeight: number,
  target: FrameTarget
): FrameLayout {
  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = target.width / target.height;

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
