import { parse as parseCacheControlHeader } from './cache-control'

export enum ServedBySource {
  CDN = 'CDN',
  DurableCache = 'Durable Cache',
  Function = 'Function',
  EdgeFunction = 'Edge Function',
}

interface ParsedCacheStatusEntry {
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

const CACHE_NAMES_SORTED_BY_RFC_9211 = [
  'Next.js',
  'Netlify Durable',
  'Netlify Edge',
]

/**
 * Per the spec, these should be sorted from "the cache closest to the origin server" to "the cache
 * closest to the user", but there appear to be scenarios where this is not the case. This fixes
 * these for now as a stopgap.
 */
const fixNonconformingUnsortedEntries = (
  unsortedEntries: readonly ParsedCacheStatusEntry[],
): ParsedCacheStatusEntry[] => {
  return unsortedEntries.toSorted((a, b) => {
    // If either or both of these is not in the array (i.e. index is -1), we wouldn't be able to
    // know where it should "go" so don't even bother explicitly handling it.
    return (
      CACHE_NAMES_SORTED_BY_RFC_9211.indexOf(a.cacheName)
      - CACHE_NAMES_SORTED_BY_RFC_9211.indexOf(b.cacheName)
    )
  })
}

export const parseCacheStatus = (
  // See https://httpwg.org/specs/rfc9211.html
  // example string:
  // "\"Next.js\"; hit, \"Netlify Durable\"; fwd=miss; stored, \"Netlify Edge\"; fwd=miss"
  cacheStatus: string,
): ParsedCacheStatusEntry[] => {
  const unfixedEntries = cacheStatus
    .split(', ')
    .map((entry): null | ParsedCacheStatusEntry => {
      const [cacheName, ...parameters] = entry.split('; ')
      if (!cacheName || parameters.length === 0) {
        console.warn('Ignoring invalid cache status entry', { entry })
        return null
      }

      const parametersByKey = new Map(
        parameters
          .map((parameter) => {
            const [key, value] = parameter.split('=')
            if (!key) {
              console.warn('Ignoring invalid cache status entry', { entry })
              return null
            }
            return [key, value]
          })
          .filter((kv): kv is [string, string | undefined] => kv != null),
      )
      return {
        cacheName: cacheName.slice(1, -1), // "Netlify Edge" -> Netlify Edge
        parameters: {
          'hit': parametersByKey.has('hit'),
          'fwd': parametersByKey.get(
            'fwd',
          ) as ParsedCacheStatusEntry['parameters']['fwd'],
          'fwd-status': Number(parametersByKey.get('fwd-status')),
          'ttl': Number(parametersByKey.get('ttl')),
          'stored': parametersByKey.has('stored'),
          'collapsed': parametersByKey.has('collapsed'),
          'key': parametersByKey.get('key'),
          'detail': parametersByKey.get('detail'),
        },
      }
    })
    .filter((e): e is ParsedCacheStatusEntry => e != null)

  const sortedEntries = fixNonconformingUnsortedEntries(unfixedEntries)

  // Per the spec, these should be sorted from "the cache closest to the origin server" to "the cache closest to the user".
  // As a user interpreting what happened, you want these to start from yourself.
  // TODO(serhalp) More of a presentation layer concern? Move to the component?
  return sortedEntries.toReversed()
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
  if (cacheHeaders.has('X-NF-Function-Type')) return ServedBySource.Function

  if (cacheHeaders.has('X-NF-Edge-Functions'))
    return ServedBySource.EdgeFunction

  throw new Error(
    `Could not determine who served the request. Cache status: ${cacheStatus}`,
  )
}

/**
 * There is a bug where sometimes duplicate hosts are returned in the `X-BB-Host-Id` header. This is
 * doubly confusing because there are legitimate cases where the same node could be involved more
 * than once in the handling of a given request, but we can't distinguish those from dupes. So just dedupe.
 */
const fixDuplicatedCdnNodes = (unfixedCdnNodes: string): string => {
  return Array.from(new Set(unfixedCdnNodes.split(', '))).join(', ')
}

interface ServedBy {
  source: ServedBySource
  cdnNodes: string
}

const getServedBy = (
  cacheHeaders: Headers,
  cacheStatus: ParsedCacheStatusEntry[],
): ServedBy => {
  const source = getServedBySource(cacheHeaders, cacheStatus)
  const unfixedCdnNodes
    = cacheHeaders.get('X-BB-Host-Id') ?? 'unknown CDN node'
  return {
    source,
    cdnNodes: fixDuplicatedCdnNodes(unfixedCdnNodes),
  }
}

export const getTimeToLive = (
  age: number | undefined,
  date: Date | undefined,
  expiresAt: Date | undefined,
  maxAge: number | null,
  now: number,
): number | undefined => {
  // TODO(serhalp) This implementation is madness. There must be a simpler way to do this and/or a
  // library we can use.

  const effectiveDate = date ?? new Date(now)
  const effectiveAge = age ?? (now - effectiveDate.getTime()) / 1000
  const trulyEffectiveDate = date ?? new Date(now - 1000 * effectiveAge)

  const effectiveMaxAge
    = maxAge
    ?? (expiresAt != null
      ? (expiresAt.getTime() - trulyEffectiveDate.getTime()) / 1000
      : undefined)

  if (effectiveMaxAge != null) {
    return effectiveMaxAge - effectiveAge
  }
}

interface ParsedCacheControl {
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

const parseCacheControl = (
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
    cacheHeaders.get('Netlify-CDN-Cache-Control'),
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

export interface CacheAnalysis {
  servedBy: ServedBy
  cacheStatus: ParsedCacheStatusEntry[]
  cacheControl: ParsedCacheControl
}

export default function getCacheAnalysis(
  cacheHeadersObj: Record<string, string>,
  now: number,
): CacheAnalysis {
  // Use a Headers instance for case insensitivity and multi-value handling
  const cacheHeaders = new Headers(cacheHeadersObj)
  const cacheStatus = parseCacheStatus(cacheHeaders.get('Cache-Status') ?? '')

  return {
    servedBy: getServedBy(cacheHeaders, cacheStatus),
    cacheStatus,
    cacheControl: parseCacheControl(cacheHeaders, now),
  }
}
