import type { ImportProvider } from "@/lib/events/import/types";

/** Providers that support catalog discovery (add new ids + provider module when needed). */
export type DiscoveryProviderId = ImportProvider;

export type DiscoveredCatalogItem = {
  externalId: string;
  title: string;
  url: string;
  city?: string;
  place?: string;
  dateHint?: string;
  imageUrl?: string;
  categoryHint?: string;
  /** true = دکمه «خرید بلیت»؛ false = فروش زمان‌بندی‌شده مثل «فروش از فردا» */
  onSale?: boolean;
  saleHint?: string;
  /** تیوال: تعداد نظر کاربران */
  reviewCount?: number;
  /** تیوال: میانگین امتیاز */
  avgRating?: number;
  /** رتبه در فید پرفروش/امتیاز */
  popularityRank?: number;
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
