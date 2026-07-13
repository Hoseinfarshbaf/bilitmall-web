import { NextResponse } from "next/server";
import { importEventFromUrl } from "@/lib/events/import";
import type { ImportProvider } from "@/lib/events/import/types";

const PROVIDERS = new Set<ImportProvider | "auto">(["auto", "honarticket", "tiwall"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      url?: string;
      answers?: Record<string, string>;
      provider?: ImportProvider | "auto";
    };

    const url = body.url?.trim();
    if (!url) {
      return NextResponse.json({ error: "لینک رویداد الزامی است." }, { status: 400 });
    }

    const provider =
      body.provider && PROVIDERS.has(body.provider) ? body.provider : "auto";

    const result = await importEventFromUrl(url, body.answers, { provider });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "خطا در استخراج اطلاعات رویداد.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
