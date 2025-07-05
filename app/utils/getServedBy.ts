export enum ServedBySource {
  CDN = 'CDN',
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
  for (const {
    cacheName,
    parameters: { hit },
  } of cacheStatus) {
    if (!hit) continue

    if (cacheName === 'Netlify Edge') return ServedBySource.CDN
    if (cacheName === 'Netlify Durable') return ServedBySource.DurableCache
  }

  // NOTE: the order is important here, since a response can be served by a Function even
  // though one or more Edge Functions are also invoked (as middleware).
  if (cacheHeaders.has('Debug-X-NF-Function-Type'))
    return ServedBySource.Function

  if (cacheHeaders.has('Debug-X-NF-Edge-Functions'))
    return ServedBySource.EdgeFunction

  // If no cache hits and no function headers, but CDN was involved (indicated by Debug-X-BB-Host-Id),
  // then the CDN served the request (likely a cache miss that was forwarded to origin)
  if (cacheHeaders.has('Debug-X-BB-Host-Id'))
    return ServedBySource.CDN

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
  return Array.from(new Set(unfixedCdnNodes.split(', '))).join(', ')
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
