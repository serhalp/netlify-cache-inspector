import { parse as parseCacheControlHeader } from './cache-control'
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
  const staleWhileRevalidate = cacheControl.staleWhileRevalidate ?? undefined
  const cdnStaleWhileRevalidate =
    cdnCacheControl.staleWhileRevalidate ?? cacheControl.staleWhileRevalidate ?? undefined
  const netlifyCdnStaleWhileRevalidate =
    netlifyCdnCacheControl.staleWhileRevalidate ??
    cdnCacheControl.staleWhileRevalidate ??
    cacheControl.staleWhileRevalidate ??
    undefined

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
    staleWhileRevalidate,
    cdnStaleWhileRevalidate,
    netlifyCdnStaleWhileRevalidate,
    freshness: getFreshness(ttl, staleWhileRevalidate),
    cdnFreshness: getFreshness(cdnTtl, cdnStaleWhileRevalidate),
    netlifyCdnFreshness: getFreshness(netlifyCdnTtl, netlifyCdnStaleWhileRevalidate),
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
