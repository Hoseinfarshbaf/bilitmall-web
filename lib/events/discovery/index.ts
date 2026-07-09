import { getAllEvents } from "@/lib/events";
import { attachMatchResults } from "./match";
import { getCachedProviderResult, setCachedProviderResult } from "./cache";
import {
  DISCOVERY_PROVIDER_IDS,
  getDiscoveryProvider,
  listDiscoveryProviders,
} from "./registry";
import type {
  DiscoveredEventRow,
  DiscoveryProviderId,
  DiscoveryScanResult,
  ProviderDiscoveryResult,
} from "./types";

export type DiscoverEventsOptions = {
  provider?: DiscoveryProviderId | "all";
  refresh?: boolean;
  unregisteredOnly?: boolean;
};

async function scanProvider(
  providerId: DiscoveryProviderId,
  refresh: boolean,
  unregisteredOnly: boolean
): Promise<ProviderDiscoveryResult> {
  if (!refresh) {
    const cached = getCachedProviderResult(providerId);
    if (cached) {
      const events = unregisteredOnly
        ? cached.events.filter((e) => e.registrationStatus === "unregistered")
        : cached.events;
      return {
        ...cached,
        events,
        unregisteredCount: cached.events.filter((e) => e.registrationStatus === "unregistered")
          .length,
        registeredCount: cached.events.filter((e) => e.registrationStatus === "registered").length,
        totalExternal: cached.events.length,
      };
    }
  }

  const provider = getDiscoveryProvider(providerId);
  const scannedAt = new Date().toISOString();

  try {
    const catalog = await provider.discoverCatalog();
    const registeredEvents = await getAllEvents({
      includeUnpublished: true,
      includeEnded: true,
    });

    const matched = attachMatchResults(catalog, providerId, registeredEvents);
    const registeredCount = matched.filter((e) => e.registrationStatus === "registered").length;
    const unregisteredCount = matched.length - registeredCount;

    const result: ProviderDiscoveryResult = {
      provider: providerId,
      label: provider.label,
      scannedAt,
      fromCache: false,
      status: "ok",
      totalExternal: matched.length,
      registeredCount,
      unregisteredCount,
      events: unregisteredOnly
        ? matched.filter((e) => e.registrationStatus === "unregistered")
        : matched,
    };

    setCachedProviderResult({ ...result, events: matched });
    return result;
  } catch (error) {
    return {
      provider: providerId,
      label: provider.label,
      scannedAt,
      fromCache: false,
      status: "error",
      error: error instanceof Error ? error.message : "خطا در اسکن فروشگاه",
      totalExternal: 0,
      registeredCount: 0,
      unregisteredCount: 0,
      events: [],
    };
  }
}

export async function discoverExternalEvents(
  options: DiscoverEventsOptions = {}
): Promise<DiscoveryScanResult> {
  const provider = options.provider ?? "all";
  const refresh = options.refresh === true;
  const unregisteredOnly = options.unregisteredOnly !== false;

  const providerIds =
    provider === "all" ? DISCOVERY_PROVIDER_IDS : [provider];

  const providers: ProviderDiscoveryResult[] = [];
  for (const id of providerIds) {
    providers.push(await scanProvider(id, refresh, unregisteredOnly));
  }

  const scannedAt = new Date().toISOString();
  const fromCache = providers.every((p) => p.fromCache);

  return { scannedAt, fromCache, providers };
}

export function getDiscoveryProviderLabels(): { id: DiscoveryProviderId; label: string }[] {
  return listDiscoveryProviders().map((p) => ({ id: p.id, label: p.label }));
}

export type { DiscoveredEventRow, DiscoveryScanResult, ProviderDiscoveryResult };
