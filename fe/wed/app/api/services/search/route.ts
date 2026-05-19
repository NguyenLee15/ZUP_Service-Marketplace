import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/api/_lib/proxy';

type CachedSearchResponse = {
  body: string;
  contentType: string;
  expiresAt: number;
  status: number;
};

const SEARCH_CACHE_TTL_MS = 30_000;
const SEARCH_CACHE_MAX_ENTRIES = 100;
const SEARCH_CACHE_CONTROL = 'public, s-maxage=30, stale-while-revalidate=120';
const searchResponseCache = new Map<string, CachedSearchResponse>();
const inFlightSearchRequests = new Map<string, Promise<CachedSearchResponse>>();

function getSearchCacheKey(req: NextRequest) {
  const params = new URLSearchParams(req.nextUrl.searchParams);
  params.sort();
  return params.toString();
}

function pruneSearchCache(now: number) {
  if (searchResponseCache.size <= SEARCH_CACHE_MAX_ENTRIES) return;

  for (const [key, value] of searchResponseCache) {
    if (value.expiresAt <= now || searchResponseCache.size > SEARCH_CACHE_MAX_ENTRIES / 2) {
      searchResponseCache.delete(key);
    }
  }
}

function buildCachedResponse(entry: CachedSearchResponse, cacheStatus: 'HIT' | 'MISS' | 'DEDUPED') {
  const isSuccess = entry.status >= 200 && entry.status < 300;

  return new Response(entry.body, {
    status: entry.status,
    headers: {
      'Cache-Control': isSuccess ? SEARCH_CACHE_CONTROL : 'no-store',
      'Content-Type': entry.contentType,
      'X-Search-Cache': cacheStatus,
    },
  });
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization')) {
    return proxyToBackend(req, '/services/search');
  }

  const now = Date.now();
  const cacheKey = getSearchCacheKey(req);
  const cached = searchResponseCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return buildCachedResponse(cached, 'HIT');
  }

  pruneSearchCache(now);

  let request = inFlightSearchRequests.get(cacheKey);
  const cacheStatus = request ? 'DEDUPED' : 'MISS';

  if (!request) {
    request = proxyToBackend(req, '/services/search').then(async (response) => {
      const body = await response.text();
      const contentType = response.headers.get('content-type') || 'application/json';
      const entry: CachedSearchResponse = {
        body,
        contentType,
        expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
        status: response.status,
      };

      if (response.ok) {
        searchResponseCache.set(cacheKey, entry);
      }

      return entry;
    }).finally(() => {
      inFlightSearchRequests.delete(cacheKey);
    });

    inFlightSearchRequests.set(cacheKey, request);
  }

  const entry = await request;
  return buildCachedResponse(entry, cacheStatus);
}
