import { fetchEventPage } from "@/lib/events/import/fetch-page";
import type { DiscoveredCatalogItem, DiscoveryProviderId, EventDiscoveryProvider } from "./types";
import { HONARTICKET_CATALOG_URLS, parseHonarticketStoreCards } from "./providers/honarticket";
import { TIWALL_CATALOG_URLS, discoverTiwallPopularEvents } from "./providers/tiwall";

function dedupeCatalogItems(items: DiscoveredCatalogItem[]): DiscoveredCatalogItem[] {
  const byUrl = new Map<string, DiscoveredCatalogItem>();
  for (const item of items) {
    const existing = byUrl.get(item.url);
    if (!existing || item.title.length > existing.title.length) {
      byUrl.set(item.url, item);
    }
  }
  return [...byUrl.values()];
}

async function fetchHtml(url: string): Promise<string> {
  const { html } = await fetchEventPage(url);
  return html;
}

const honarticketProvider: EventDiscoveryProvider = {
  id: "honarticket",
  label: "هنر تیکت",
  catalogUrls: HONARTICKET_CATALOG_URLS,
  async discoverCatalog() {
    const collected: DiscoveredCatalogItem[] = [];

    for (const catalogUrl of HONARTICKET_CATALOG_URLS) {
      const html = await fetchHtml(catalogUrl);
      collected.push(...parseHonarticketStoreCards(html));
    }

    return dedupeCatalogItems(collected);
  },
};

const tiwallProvider: EventDiscoveryProvider = {
  id: "tiwall",
  label: "تیوال",
  catalogUrls: TIWALL_CATALOG_URLS,
  async discoverCatalog() {
    return discoverTiwallPopularEvents(fetchHtml);
  },
};

const PROVIDERS: Record<DiscoveryProviderId, EventDiscoveryProvider> = {
  honarticket: honarticketProvider,
  tiwall: tiwallProvider,
};

export const DISCOVERY_PROVIDER_IDS = Object.keys(PROVIDERS) as DiscoveryProviderId[];

export function getDiscoveryProvider(id: DiscoveryProviderId): EventDiscoveryProvider {
  return PROVIDERS[id];
}

export function listDiscoveryProviders(): EventDiscoveryProvider[] {
  return DISCOVERY_PROVIDER_IDS.map((id) => PROVIDERS[id]);
}
