import type { DiscoveryProviderId, ProviderDiscoveryResult } from "./types";

type CacheRecord = {
  scannedAt: string;
  result: ProviderDiscoveryResult;
};

const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map<DiscoveryProviderId, CacheRecord>();

export function getCachedProviderResult(
  provider: DiscoveryProviderId
): ProviderDiscoveryResult | null {
  const record = cache.get(provider);
  if (!record) return null;
  if (Date.now() - new Date(record.scannedAt).getTime() > CACHE_TTL_MS) {
    cache.delete(provider);
    return null;
  }
  return { ...record.result, fromCache: true };
}

export function setCachedProviderResult(result: ProviderDiscoveryResult): void {
  cache.set(result.provider, {
    scannedAt: result.scannedAt,
    result: { ...result, fromCache: false },
  });
}

export function clearDiscoveryCache(provider?: DiscoveryProviderId): void {
  if (provider) cache.delete(provider);
  else cache.clear();
}
