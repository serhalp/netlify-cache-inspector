import { type CacheControl, parse as parseCacheControlHeader } from './cache-control'
import { getFreshness, type Freshness } from './getFreshness'
import { getTimeToLive } from './getTimeToLive'

export interface ParsedCacheControl {
  // TODO(serhalp) Split into `isCacheable`, `isCdnCacheable`, `isNetlifyCdnCacheable`
  isCacheable: boolean
  age?: number
  date?: Date
  etag?: string
  expiresAt?: Date
  ttl?: number
  cdnTtl?: number
  netlifyCdnTtl?: number
  staleWhileRevalidate?: number
  cdnStaleWhileRevalidate?: number
  netlifyCdnStaleWhileRevalidate?: number
  freshness?: Freshness
  cdnFreshness?: Freshness
  netlifyCdnFreshness?: Freshness
  vary?: string
  netlifyVary?: string
  // TODO(serhalp) Split into `revalidate`, `cdnRevalidate`, `netlifyCdnRevalidate`
  revalidate?: 'must-revalidate' | 'immutable'
}

interface StaleWhileRevalidate {
  value?: number
  prohibitedBy?: string
}

// RFC 9111 §4.2.4: these directives forbid serving stale, which makes any SWR window inert.
// `proxy-revalidate` only binds shared caches (CDNs), not browsers.
const getStaleServingProhibitedBy = (
  cacheControl: CacheControl,
  isSharedCache: boolean,
): string | undefined => {
  if (cacheControl.mustRevalidate) return 'must-revalidate'
  if (isSharedCache && cacheControl.proxyRevalidate) return 'proxy-revalidate'
  if (cacheControl.noCache) return 'no-cache'
  if (cacheControl.noStore) return 'no-store'
  return undefined
}

// Takes the SWR from the first header (in precedence order) that specifies it, along with any
// directive in that same header that forbids serving stale.
const getStaleWhileRevalidate = (
  cacheControlsByPrecedence: CacheControl[],
  isSharedCache: boolean,
): StaleWhileRevalidate => {
  const source = cacheControlsByPrecedence.find((cc) => cc.staleWhileRevalidate != null)
  if (source == null) return {}
  return {
    value: source.staleWhileRevalidate ?? undefined,
    prohibitedBy: getStaleServingProhibitedBy(source, isSharedCache),
  }
}

export const parseCacheControl = (cacheHeaders: Headers, now: number): ParsedCacheControl => {
  const ageHeader = cacheHeaders.get('Age')
  const dateHeader = cacheHeaders.get('Date')
  const expiresHeader = cacheHeaders.get('Expires')
  const cacheControl = parseCacheControlHeader(cacheHeaders.get('Cache-Control'))
  const cdnCacheControl = parseCacheControlHeader(cacheHeaders.get('CDN-Cache-Control'))
  const netlifyCdnCacheControl = parseCacheControlHeader(
    cacheHeaders.get('Debug-Netlify-CDN-Cache-Control'),
  )

  const age = ageHeader != null && ageHeader.length > 0 ? Number.parseInt(ageHeader) : undefined
  const date = dateHeader ? new Date(dateHeader) : undefined
  const expiresAt = expiresHeader ? new Date(expiresHeader) : undefined

  const ttl = getTimeToLive(age, date, expiresAt, cacheControl.maxAge, now)
  const cdnTtl = getTimeToLive(
    age,
    date,
    expiresAt,
    // TODO(serhalp) Verify this is the correct order of precedence
    cdnCacheControl.sharedMaxAge ??
      cdnCacheControl.maxAge ??
      cacheControl.sharedMaxAge ??
      cacheControl.maxAge,
    now,
  )
  const netlifyCdnTtl = getTimeToLive(
    age,
    date,
    expiresAt,
    // TODO(serhalp) Verify this is the correct order of precedence
    netlifyCdnCacheControl.sharedMaxAge ??
      netlifyCdnCacheControl.maxAge ??
      cdnCacheControl.sharedMaxAge ??
      cdnCacheControl.maxAge ??
      cacheControl.sharedMaxAge ??
      cacheControl.maxAge,
    now,
  )

  // Mirrors the (directive-level) fallback chain used for the TTLs above; see the TODOs there.
  const staleWhileRevalidate = getStaleWhileRevalidate([cacheControl], false)
  const cdnStaleWhileRevalidate = getStaleWhileRevalidate([cdnCacheControl, cacheControl], true)
  const netlifyCdnStaleWhileRevalidate = getStaleWhileRevalidate(
    [netlifyCdnCacheControl, cdnCacheControl, cacheControl],
    true,
  )

  return {
    // TODO(serhalp) Actually implement complete logic
    isCacheable:
      cacheControl.private !== true &&
      cacheControl.noStore !== true &&
      cacheControl.noCache !== true,
    age,
    date,
    etag: cacheHeaders.get('ETag') ?? undefined,
    expiresAt,
    ttl,
    cdnTtl,
    netlifyCdnTtl,
    staleWhileRevalidate: staleWhileRevalidate.value,
    cdnStaleWhileRevalidate: cdnStaleWhileRevalidate.value,
    netlifyCdnStaleWhileRevalidate: netlifyCdnStaleWhileRevalidate.value,
    freshness: getFreshness(ttl, staleWhileRevalidate.value, staleWhileRevalidate.prohibitedBy),
    cdnFreshness: getFreshness(
      cdnTtl,
      cdnStaleWhileRevalidate.value,
      cdnStaleWhileRevalidate.prohibitedBy,
    ),
    netlifyCdnFreshness: getFreshness(
      netlifyCdnTtl,
      netlifyCdnStaleWhileRevalidate.value,
      netlifyCdnStaleWhileRevalidate.prohibitedBy,
    ),
    vary: cacheHeaders.get('Vary') ?? undefined,
    netlifyVary: cacheHeaders.get('Netlify-Vary') ?? undefined,
    // TODO(serhalp) Support weirder cases? `proxy-revalidate`, must-understand`, etc.
    revalidate:
      cacheControl.mustRevalidate === true
        ? 'must-revalidate'
        : cacheControl.immutable === true
          ? 'immutable'
          : undefined,
  }
}
