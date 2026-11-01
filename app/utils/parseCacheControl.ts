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
export const getStaleServingProhibitedBy = (
  cacheControl: CacheControl,
  isSharedCache: boolean,
): string | undefined => {
  if (cacheControl.mustRevalidate) return 'must-revalidate'
  if (isSharedCache && cacheControl.proxyRevalidate) return 'proxy-revalidate'
  if (cacheControl.noCache) return 'no-cache'
  if (cacheControl.noStore) return 'no-store'
  return undefined
}

// Netlify docs: when several cache-control headers are present, the most specific one wins
// outright. So a tier takes its TTL, SWR and stale-serving prohibitions from one header and must
// not inherit them from a less specific one (e.g. `Cache-Control` SWR must not apply to the CDN
// when `CDN-Cache-Control` is set).
const getStaleWhileRevalidate = (
  source: CacheControl | undefined,
  isSharedCache: boolean,
): StaleWhileRevalidate => {
  if (source == null || source.staleWhileRevalidate == null) return {}
  return {
    value: source.staleWhileRevalidate,
    prohibitedBy: getStaleServingProhibitedBy(source, isSharedCache),
  }
}

export const parseCacheControl = (cacheHeaders: Headers, now: number): ParsedCacheControl => {
  const ageHeader = cacheHeaders.get('Age')
  const dateHeader = cacheHeaders.get('Date')
  const expiresHeader = cacheHeaders.get('Expires')
  const cacheControlHeader = cacheHeaders.get('Cache-Control')
  const cdnCacheControlHeader = cacheHeaders.get('CDN-Cache-Control')
  const netlifyCdnCacheControlHeader = cacheHeaders.get('Debug-Netlify-CDN-Cache-Control')
  const cacheControl = parseCacheControlHeader(cacheControlHeader)
  const cdnCacheControl = parseCacheControlHeader(cdnCacheControlHeader)
  const netlifyCdnCacheControl = parseCacheControlHeader(netlifyCdnCacheControlHeader)

  const age = ageHeader != null && ageHeader.length > 0 ? Number.parseInt(ageHeader) : undefined
  const date = dateHeader ? new Date(dateHeader) : undefined
  const expiresAt = expiresHeader ? new Date(expiresHeader) : undefined

  // Header precedence per Netlify's docs. The "CDN" tier models downstream CDNs, which receive
  // `CDN-Cache-Control` when present and `Cache-Control` otherwise; Netlify additionally honours
  // its own `Netlify-CDN-Cache-Control` above both.
  const browserCacheControl = cacheControlHeader != null ? cacheControl : undefined
  const cdnTierCacheControl =
    cdnCacheControlHeader != null
      ? cdnCacheControl
      : cacheControlHeader != null
        ? cacheControl
        : undefined
  const netlifyCdnTierCacheControl =
    netlifyCdnCacheControlHeader != null ? netlifyCdnCacheControl : cdnTierCacheControl

  const ttl = getTimeToLive(age, date, expiresAt, browserCacheControl?.maxAge ?? null, now)
  const cdnTtl = getTimeToLive(
    age,
    date,
    expiresAt,
    cdnTierCacheControl?.sharedMaxAge ?? cdnTierCacheControl?.maxAge ?? null,
    now,
  )
  const netlifyCdnTtl = getTimeToLive(
    age,
    date,
    expiresAt,
    netlifyCdnTierCacheControl?.sharedMaxAge ?? netlifyCdnTierCacheControl?.maxAge ?? null,
    now,
  )

  const staleWhileRevalidate = getStaleWhileRevalidate(browserCacheControl, false)
  const cdnStaleWhileRevalidate = getStaleWhileRevalidate(cdnTierCacheControl, true)
  const netlifyCdnStaleWhileRevalidate = getStaleWhileRevalidate(netlifyCdnTierCacheControl, true)

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
