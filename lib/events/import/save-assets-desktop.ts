import fs from "fs/promises";
import os from "os";
import path from "path";
import type { EventAssetUrls } from "./extract-assets";

const FETCH_TIMEOUT_MS = 20_000;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

function sanitizeFolderName(name: string): string {
  const cleaned = name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return cleaned || "رویداد";
}

function resolveDesktopPath(): string {
  const home = os.homedir();
  const oneDriveDesktop = process.env.OneDrive
    ? path.join(process.env.OneDrive, "Desktop")
    : null;
  const candidates = [
    path.join(home, "Desktop"),
    oneDriveDesktop,
    path.join(home, "OneDrive", "Desktop"),
  ].filter((p): p is string => Boolean(p));

  return candidates[0] ?? home;
}

function extensionFromUrl(imageUrl: string, contentType: string): string {
  const urlPath = new URL(imageUrl).pathname.toLowerCase();
  if (urlPath.endsWith(".webp")) return ".webp";
  if (urlPath.endsWith(".png")) return ".png";
  if (urlPath.endsWith(".jpeg") || urlPath.endsWith(".jpg")) return ".jpg";
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return ".jpg";
  return ".jpg";
}

async function downloadBinary(imageUrl: string, referer?: string): Promise<{ buffer: Buffer; ext: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let currentUrl = imageUrl;
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      Accept: "image/*,*/*;q=0.8",
      ...(referer ? { Referer: referer } : {}),
    };

    for (let redirect = 0; redirect <= 8; redirect += 1) {
      const response = await fetch(currentUrl, {
        signal: controller.signal,
        headers,
        redirect: "manual",
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return null;
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (!response.ok) return null;

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/")) return null;

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength > MAX_IMAGE_BYTES) return null;

      return {
        buffer,
        ext: extensionFromUrl(currentUrl, contentType),
      };
    }

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type SavedEventAssetsResult = {
  folderPath: string;
  files: string[];
  warnings: string[];
};

export async function saveEventAssetsToDesktop(
  eventTitle: string,
  assets: EventAssetUrls,
  options?: { sourcePageUrl?: string }
): Promise<SavedEventAssetsResult> {
  const folderName = sanitizeFolderName(eventTitle);
  const folderPath = path.join(resolveDesktopPath(), folderName);
  await fs.mkdir(folderPath, { recursive: true });

  const files: string[] = [];
  const warnings: string[] = [];

  if (assets.cardImageUrl) {
    const downloaded = await downloadBinary(
      assets.cardImageUrl,
      options?.sourcePageUrl
    );
    if (downloaded) {
      const filename = `card${downloaded.ext}`;
      const filePath = path.join(folderPath, filename);
      await fs.writeFile(filePath, downloaded.buffer);
      files.push(filePath);
    } else {
      warnings.push("دانلود تصویر کارت ناموفق بود.");
    }
  } else {
    warnings.push("تصویر کارت در صفحه مبدأ یافت نشد.");
  }

  if (assets.bannerImageUrl) {
    const downloaded = await downloadBinary(
      assets.bannerImageUrl,
      options?.sourcePageUrl
    );
    if (downloaded) {
      const filename = `banner${downloaded.ext}`;
      const filePath = path.join(folderPath, filename);
      await fs.writeFile(filePath, downloaded.buffer);
      files.push(filePath);
    } else {
      warnings.push("دانلود تصویر بنر ناموفق بود.");
    }
  } else {
    warnings.push("تصویر بنر در صفحه مبدأ یافت نشد.");
  }

  if (files.length === 0) {
    throw new Error("هیچ تصویری دانلود نشد.");
  }

  return { folderPath, files, warnings };
}
