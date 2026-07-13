import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { ensureUploadDir } from "@/lib/events/form-data";
import { EVENT_BANNER_IMAGE, EVENT_CARD_IMAGE } from "@/lib/events/image-specs";
import { compositeImageFrame } from "@/lib/events/composite-image-frame";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15_000;

async function downloadAndProcessImage(
  imageUrl: string,
  target: typeof EVENT_CARD_IMAGE | typeof EVENT_BANNER_IMAGE,
  fit: "card" | "banner",
  prefix: string
): Promise<string | null> {
  if (!imageUrl?.trim()) return null;

  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 BilitmallImporter/1.0" },
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_IMAGE_BYTES) return null;

    await ensureUploadDir();
    const filename = `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
    const filepath = path.join(process.cwd(), "public", "uploads", "events", filename);

    const processed = await sharp(await compositeImageFrame(buffer, target, { fit }))
      .webp({ quality: 85 })
      .toBuffer();

    await fs.writeFile(filepath, processed);
    return `/uploads/events/${filename}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function downloadEventImageFromUrl(imageUrl: string): Promise<string | null> {
  return downloadAndProcessImage(imageUrl, EVENT_CARD_IMAGE, "card", "card");
}

export async function downloadEventBannerImageFromUrl(
  imageUrl: string
): Promise<string | null> {
  return downloadAndProcessImage(imageUrl, EVENT_BANNER_IMAGE, "banner", "banner");
}
