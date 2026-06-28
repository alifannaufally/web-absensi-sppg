interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  staleAt: number;
}

const store = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL = 60_000;
const STALE_TTL = 300_000;

export function cacheGet<T>(key: string): { data: T | null; isStale: boolean } {
  const entry = store.get(key);
  if (!entry) return { data: null, isStale: false };
  if (Date.now() > entry.expiresAt) {
    if (Date.now() > entry.staleAt) {
      store.delete(key);
      return { data: null, isStale: false };
    }
    return { data: entry.data, isStale: true };
  }
  return { data: entry.data, isStale: false };
}

export function cacheSet<T>(key: string, data: T, ttl = DEFAULT_TTL, swr = STALE_TTL) {
  store.set(key, { data, expiresAt: Date.now() + ttl, staleAt: Date.now() + swr });
}

export function cacheDelete(pattern: string) {
  for (const key of store.keys()) {
    if (key.startsWith(pattern)) store.delete(key);
  }
}

export function cacheGetOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = DEFAULT_TTL,
  swr = STALE_TTL,
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached.data && !cached.isStale) return Promise.resolve(cached.data);
  if (cached.isStale) {
    fetcher().then((fresh) => cacheSet(key, fresh, ttl, swr)).catch(() => {});
    return Promise.resolve(cached.data!);
  }
  return fetcher().then((data) => {
    cacheSet(key, data, ttl, swr);
    return data;
  });
}
