import sharp, { type Sharp } from "sharp";
import {
  EVENT_IMAGE_FRAME_BLUR_BRIGHTNESS,
  EVENT_IMAGE_FRAME_BLUR_OVERSCAN,
  EVENT_IMAGE_FRAME_BLUR_SATURATION,
  EVENT_IMAGE_FRAME_BLUR_SIGMA,
  EVENT_IMAGE_FRAME_BLUR_SIGMA_FINE,
} from "./image-specs";
import { resolveFrameLayout } from "./image-frame-layout";
import type { FrameTarget } from "./image-frame-types";

export type ImageFrameFit = "card" | "banner";

export type CompositeImageFrameOptions = {
  fit?: ImageFrameFit;
  blurSigma?: number;
};

async function buildBlurredBackground(
  base: Sharp,
  target: FrameTarget,
  blurSigma: number
) {
  const overscanW = Math.round(target.width * EVENT_IMAGE_FRAME_BLUR_OVERSCAN);
  const overscanH = Math.round(target.height * EVENT_IMAGE_FRAME_BLUR_OVERSCAN);

  return base
    .clone()
    .resize(overscanW, overscanH, {
      fit: "cover",
      position: "centre",
    })
    .blur(blurSigma)
    .blur(EVENT_IMAGE_FRAME_BLUR_SIGMA_FINE)
    .resize(target.width, target.height, { fit: "cover", position: "centre" })
    .modulate({
      brightness: EVENT_IMAGE_FRAME_BLUR_BRIGHTNESS,
      saturation: EVENT_IMAGE_FRAME_BLUR_SATURATION,
    })
    .toBuffer();
}

/** تصویر کامل (contain) در قاب ثابت + پس‌زمینه محو — بدون کات */
export async function compositeImageFrame(
  input: Buffer,
  target: FrameTarget,
  options: CompositeImageFrameOptions = {}
): Promise<Buffer> {
  const blurSigma = options.blurSigma ?? EVENT_IMAGE_FRAME_BLUR_SIGMA;

  const base = sharp(input).rotate();
  const meta = await base.metadata();
  const sourceWidth = meta.width ?? target.width;
  const sourceHeight = meta.height ?? target.height;

  const background = await buildBlurredBackground(base, target, blurSigma);
  const layout = resolveFrameLayout(sourceWidth, sourceHeight, target);

  const foreground = await base
    .clone()
    .resize(Math.round(layout.fgW), Math.round(layout.fgH), {
      fit: "inside",
      withoutEnlargement: false,
    })
    .toBuffer();

  return sharp(background)
    .composite([{ input: foreground, gravity: "centre" }])
    .toBuffer();
}
