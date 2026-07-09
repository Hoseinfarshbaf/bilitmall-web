import { NextResponse } from "next/server";
import {
  discoverExternalEvents,
  getDiscoveryProviderLabels,
} from "@/lib/events/discovery";
import type { DiscoveryProviderId } from "@/lib/events/discovery/types";
import { DISCOVERY_PROVIDER_IDS } from "@/lib/events/discovery/registry";

export async function GET() {
  return NextResponse.json({
    providers: getDiscoveryProviderLabels(),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      provider?: DiscoveryProviderId | "all";
      refresh?: boolean;
      unregisteredOnly?: boolean;
    };

    const provider = body.provider ?? "all";
    if (provider !== "all" && !DISCOVERY_PROVIDER_IDS.includes(provider)) {
      return NextResponse.json({ error: "سایت مبدأ نامعتبر است." }, { status: 400 });
    }

    const result = await discoverExternalEvents({
      provider,
      refresh: body.refresh === true,
      unregisteredOnly: body.unregisteredOnly !== false,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "خطا در کشف رویدادهای خارجی.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
