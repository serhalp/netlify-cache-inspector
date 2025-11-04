import { parse as parseCacheControlHeader } from './cache-control'
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
  vary?: string
  netlifyVary?: string
  // TODO(serhalp) Split into `revalidate`, `cdnRevalidate`, `netlifyCdnRevalidate`
  revalidate?: 'must-revalidate' | 'immutable'
  // TODO(serhalp) `swc`, `cdnSwc`, `netlifyCdnSwc`
}

export const parseCacheControl = (
  cacheHeaders: Headers,
  now: number,
): ParsedCacheControl => {
  const ageHeader = cacheHeaders.get('Age')
  const dateHeader = cacheHeaders.get('Date')
  const expiresHeader = cacheHeaders.get('Expires')
  const cacheControl = parseCacheControlHeader(
    cacheHeaders.get('Cache-Control'),
  )
  const cdnCacheControl = parseCacheControlHeader(
    cacheHeaders.get('CDN-Cache-Control'),
  )
  const netlifyCdnCacheControl = parseCacheControlHeader(
    cacheHeaders.get('Debug-Netlify-CDN-Cache-Control'),
  )

  const age
    = ageHeader != null && ageHeader.length > 0
      ? Number.parseInt(ageHeader)
      : undefined
  const date = dateHeader ? new Date(dateHeader) : undefined
  const expiresAt = expiresHeader ? new Date(expiresHeader) : undefined

  return {
    // TODO(serhalp) Actually implement complete logic
    isCacheable:
      cacheControl.private !== true
      && cacheControl.noStore !== true
      && cacheControl.noCache !== true,
    age,
    date,
    etag: cacheHeaders.get('ETag') ?? undefined,
    expiresAt,
    ttl: getTimeToLive(age, date, expiresAt, cacheControl.maxAge, now),
    cdnTtl: getTimeToLive(
      age,
      date,
      expiresAt,
      // TODO(serhalp) Verify this is the correct order of precedence
      cdnCacheControl.sharedMaxAge
      ?? cdnCacheControl.maxAge
      ?? cacheControl.sharedMaxAge
      ?? cacheControl.maxAge,
      now,
    ),
    netlifyCdnTtl: getTimeToLive(
      age,
      date,
      expiresAt,
      // TODO(serhalp) Verify this is the correct order of precedence
      netlifyCdnCacheControl.sharedMaxAge
      ?? netlifyCdnCacheControl.maxAge
      ?? cdnCacheControl.sharedMaxAge
      ?? cdnCacheControl.maxAge
      ?? cacheControl.sharedMaxAge
      ?? cacheControl.maxAge,
      now,
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
