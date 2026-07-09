import type { ImportProvider } from "@/lib/events/import/types";

/** Providers that support catalog discovery (extensible — add new ids + provider module). */
export type DiscoveryProviderId = Extract<ImportProvider, "honarticket" | "melotik">;

export type DiscoveredCatalogItem = {
  externalId: string;
  title: string;
  url: string;
  city?: string;
  place?: string;
  dateHint?: string;
  imageUrl?: string;
  categoryHint?: string;
};

export type DiscoveryMatchStatus = "unregistered" | "registered";

export type DiscoveredEventRow = DiscoveredCatalogItem & {
  provider: DiscoveryProviderId;
  registrationStatus: DiscoveryMatchStatus;
  matchedEventId?: number;
  matchedEventTitle?: string;
  matchReason?: string;
};

export type ProviderDiscoveryResult = {
  provider: DiscoveryProviderId;
  label: string;
  scannedAt: string;
  fromCache: boolean;
  status: "ok" | "error";
  error?: string;
  totalExternal: number;
  registeredCount: number;
  unregisteredCount: number;
  events: DiscoveredEventRow[];
};

export type DiscoveryScanResult = {
  scannedAt: string;
  fromCache: boolean;
  providers: ProviderDiscoveryResult[];
};

export type EventDiscoveryProvider = {
  id: DiscoveryProviderId;
  label: string;
  catalogUrls: string[];
  discoverCatalog: () => Promise<DiscoveredCatalogItem[]>;
};
