import { CACHE_TTL_MS, REQUEST_TIMEOUT_MS, USER_AGENT } from "@/constant";

interface CacheEntry {
  expiresAt: number;
  html: Promise<string>;
}

// Caching the promise (not the body) also de-duplicates concurrent requests.
const cache = new Map<string, CacheEntry>();

const request = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with HTTP ${response.status}`);
  }
  return response.text();
};

const pruneExpired = (now: number) => {
  for (const [url, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(url);
  }
};

export const fetchHtml = (url: string): Promise<string> => {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && cached.expiresAt > now) return cached.html;

  pruneExpired(now);
  const entry: CacheEntry = {
    expiresAt: now + CACHE_TTL_MS,
    html: request(url),
  };
  cache.set(url, entry);
  entry.html.catch(() => {
    if (cache.get(url) === entry) cache.delete(url);
  });
  return entry.html;
};

export const clearHtmlCache = () => cache.clear();

/** Fetches a binary file such as a photo, uncached. */
export const fetchBytes = async (url: string): Promise<Buffer> => {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with HTTP ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
};
