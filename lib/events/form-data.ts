import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import type { EventDay, EventFormData } from "@/lib/events/types";
import { hasUploadedImage } from "@/lib/events/helpers";
import { normalizeEventDays } from "@/lib/events/date-utils";
import { EVENT_BANNER_IMAGE, EVENT_CARD_IMAGE } from "@/lib/events/image-specs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "events");
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

async function saveProcessedImage(
  file: File,
  target: { width: number; height: number }
): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("فرمت تصویر مجاز نیست. JPG، PNG یا WebP انتخاب کن.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("حجم تصویر نباید بیشتر از ۸ مگابایت باشد.");
  }

  await ensureUploadDir();

  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
  const filepath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());

  const processed = await sharp(buffer)
    .rotate()
    .resize(target.width, target.height, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: 85 })
    .toBuffer();

  await fs.writeFile(filepath, processed);

  return `/uploads/events/${filename}`;
}

export async function saveEventImage(file: File): Promise<string> {
  return saveProcessedImage(file, EVENT_CARD_IMAGE);
}

export async function saveEventBannerImage(file: File): Promise<string> {
  return saveProcessedImage(file, EVENT_BANNER_IMAGE);
}

function parseDays(value: unknown): EventDay[] {
  let days: EventDay[] = [];
  if (Array.isArray(value)) days = value as EventDay[];
  else if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      days = Array.isArray(parsed) ? parsed : [];
    } catch {
      days = [];
    }
  }
  return normalizeEventDays(days);
}

export function parseEventFormData(body: Record<string, unknown>): EventFormData {
  return {
    title: String(body.title ?? ""),
    city: String(body.city ?? "تهران"),
    category: String(body.category ?? "کنسرت"),
    place: String(body.place ?? ""),
    placeAddress: String(body.placeAddress ?? ""),
    venueTemplateId: (() => {
      if (body.venueTemplateId === null || body.venueTemplateId === "") return null;
      if (body.venueTemplateId === undefined) return undefined;
      const num = Number(body.venueTemplateId);
      return Number.isFinite(num) ? num : null;
    })(),
    price: String(body.price ?? ""),
    image: String(body.image ?? ""),
    bannerImage: String(body.bannerImage ?? ""),
    badge: String(body.badge ?? ""),
    days: parseDays(body.days),
    published: body.published === true || body.published === "true",
    popular: body.popular === true || body.popular === "true",
    featured: body.featured === true || body.featured === "true",
    status: (body.status as EventFormData["status"]) ?? "active",
  };
}

export async function parseEventRequest(request: Request): Promise<{
  form: EventFormData;
  imageFile: File | null;
  bannerImageFile: File | null;
}> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();

    const rawDays = formData.get("days");
    let days: EventDay[] = [];
    if (typeof rawDays === "string") {
      days = parseDays(rawDays);
    }

    const uploadedImage = formData.get("image");
    const imageFile =
      uploadedImage instanceof File && uploadedImage.size > 0 ? uploadedImage : null;

    const uploadedBannerImage = formData.get("bannerImage");
    const bannerImageFile =
      uploadedBannerImage instanceof File && uploadedBannerImage.size > 0
        ? uploadedBannerImage
        : null;

    const form: EventFormData = {
      title: String(formData.get("title") ?? ""),
      city: String(formData.get("city") ?? "تهران"),
      category: String(formData.get("category") ?? "کنسرت"),
      place: String(formData.get("place") ?? ""),
      placeAddress: String(formData.get("placeAddress") ?? ""),
      venueTemplateId: (() => {
        const raw = formData.get("venueTemplateId");
        if (raw === null || raw === "") return null;
        const num = Number(raw);
        return Number.isFinite(num) ? num : null;
      })(),
      price: String(formData.get("price") ?? ""),
      image: String(formData.get("imageUrl") ?? ""),
      bannerImage: String(formData.get("bannerImageUrl") ?? ""),
      badge: String(formData.get("badge") ?? ""),
      days,
      published:
        formData.get("published") === "true" || formData.get("published") === "on",
      popular:
        formData.get("popular") === "true" || formData.get("popular") === "on",
      featured:
        formData.get("featured") === "true" || formData.get("featured") === "on",
      status: (String(formData.get("status") ?? "active") as EventFormData["status"]),
    };

    return { form, imageFile, bannerImageFile };
  }

  const body = (await request.json()) as Record<string, unknown>;
  return { form: parseEventFormData(body), imageFile: null, bannerImageFile: null };
}

export async function applyUploadedImages(
  form: EventFormData,
  imageFile: File | null,
  bannerImageFile: File | null
): Promise<EventFormData> {
  let next = form;

  if (imageFile) {
    const uploadedUrl = await saveEventImage(imageFile);
    next = { ...next, image: uploadedUrl };
  }

  if (bannerImageFile) {
    const uploadedUrl = await saveEventBannerImage(bannerImageFile);
    next = { ...next, bannerImage: uploadedUrl };
  }

  return next;
}

export function validateEventImage(
  form: EventFormData,
  imageFile: File | null,
  options?: { isCreate?: boolean }
): string | null {
  if (imageFile) return null;
  if (hasUploadedImage(form.image)) return null;
  if (!options?.isCreate && form.image.trim()) return null;
  return "آپلود تصویر کارت رویداد الزامی است.";
}

export function validateEventBannerImage(
  form: EventFormData,
  bannerImageFile: File | null,
  options?: { isCreate?: boolean }
): string | null {
  if (!form.featured) return null;
  if (bannerImageFile) return null;
  if (hasUploadedImage(form.bannerImage)) return null;
  if (!options?.isCreate && form.bannerImage.trim()) return null;
  return "برای نمایش در پیشنهاد ویژه، آپلود تصویر بنر الزامی است.";
}
