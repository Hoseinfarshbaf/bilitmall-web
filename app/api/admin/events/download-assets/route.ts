import { NextResponse } from "next/server";
import { extractEventAssetUrls } from "@/lib/events/import/extract-assets";
import { fetchEventPage, normalizeImportUrl } from "@/lib/events/import/fetch-page";
import { saveEventAssetsToDesktop } from "@/lib/events/import/save-assets-desktop";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      url?: string;
      title?: string;
      cardImageUrl?: string;
    };
    const url = body.url?.trim();
    if (!url) {
      return NextResponse.json({ error: "لینک رویداد الزامی است." }, { status: 400 });
    }

    const normalized = normalizeImportUrl(url);
    const { html, finalUrl } = await fetchEventPage(normalized);
    const assets = extractEventAssetUrls(html, finalUrl);
    if (body.cardImageUrl?.trim()) {
      assets.cardImageUrl = body.cardImageUrl.trim();
    }
    const title = body.title?.trim() || "رویداد";

    const result = await saveEventAssetsToDesktop(title, assets, {
      sourcePageUrl: finalUrl,
    });

    return NextResponse.json({
      ok: true,
      folderPath: result.folderPath,
      files: result.files,
      warnings: result.warnings,
      assets,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "خطا در دانلود تصاویر رویداد.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
