export enum ServedBySource {
  CdnEdge = 'CDN edge',
  CdnOrigin = 'CDN origin',
  DurableCache = 'Durable Cache',
  Function = 'Function',
  EdgeFunction = 'Edge Function',
}

export interface ParsedCacheStatusEntry {
  cacheName: string
  parameters: {
    'hit': boolean
    'fwd'?:
      | 'bypass'
      | 'method'
      | 'uri-miss'
      | 'vary-miss'
      | 'miss'
      | 'request'
      | 'stale'
      | 'partial'
    'fwd-status'?: number
    'ttl'?: number
    'stored'?: boolean
    'collapsed'?: boolean
    'key'?: string
    'detail'?: string
  }
}

export interface ServedBy {
  source: ServedBySource
  cdnNodes: string
}

const getServedBySource = (
  cacheHeaders: Headers,
  cacheStatus: ParsedCacheStatusEntry[],
): ServedBySource => {
  // Per the spec, these are sorted from "the cache closest to the origin server" to "the cache closest to the user".
  // So, the first cache hit (starting from the user) is the one that served the request.
  // But we don't quite want to return exactly the same concept of "caches" as in `Cache-Status`, so
  // we need a bit of extra logic to map to other sources.

  // First, check for cache hits
  for (const {
    cacheName,
    parameters: { hit },
  } of cacheStatus) {
    if (!hit) continue

    if (cacheName === 'Netlify Edge') return ServedBySource.CdnEdge
    if (cacheName === 'Netlify Durable') return ServedBySource.DurableCache
  }

  // NOTE: the order is important here, since a response can be served by a Function even
  // though one or more Edge Functions are also invoked (as middleware).
  if (cacheHeaders.has('Debug-X-NF-Function-Type'))
    return ServedBySource.Function

  if (cacheHeaders.has('Debug-X-NF-Edge-Functions'))
    return ServedBySource.EdgeFunction

  // Check for the specific case of ONLY a Netlify Edge miss with no other cache entries - this handles
  // the weird Netlify Cache-Status behavior where a miss on the CDN edge (with no other caches consulted)
  // means the request was forwarded directly to the CDN origin. This can only be detected when there's
  // a single cache status entry for Netlify Edge that is a miss, with no entries at all for subsequent caches.
  // If there were other cache entries (e.g., Netlify Durable), those caches were consulted, and we'd be in
  // a different scenario where it's unclear whether the CDN origin or actual origin served the request.
  if (cacheStatus.length === 1
    && cacheStatus[0]?.cacheName === 'Netlify Edge'
    && !cacheStatus[0]?.parameters.hit) {
    return ServedBySource.CdnOrigin
  }

  throw new Error(
    `Could not determine who served the request. Cache status: ${cacheStatus}`,
  )
}

/**
 * There is a bug where sometimes duplicate hosts are returned in the `Debug-X-BB-Host-Id` header. This is
 * doubly confusing because there are legitimate cases where the same node could be involved more
 * than once in the handling of a given request, but we can't distinguish those from dupes. So just dedupe.
 */
const fixDuplicatedCdnNodes = (unfixedCdnNodes: string): string => {
  return [...new Set(unfixedCdnNodes.split(', '))].join(', ')
}

export const getServedBy = (
  cacheHeaders: Headers,
  cacheStatus: ParsedCacheStatusEntry[],
): ServedBy => {
  const source = getServedBySource(cacheHeaders, cacheStatus)
  const unfixedCdnNodes
    = cacheHeaders.get('Debug-X-BB-Host-Id') ?? 'unknown CDN node'
  return {
    source,
    cdnNodes: fixDuplicatedCdnNodes(unfixedCdnNodes),
  }
}
