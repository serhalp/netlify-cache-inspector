import { getServedBy, type ServedBy } from './getServedBy'
import { parseCacheControl, type ParsedCacheControl } from './parseCacheControl'

const CACHE_NAMES_SORTED_BY_RFC_9211 = ['Next.js', 'Netlify Durable', 'Netlify Edge']

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
      CACHE_NAMES_SORTED_BY_RFC_9211.indexOf(a.cacheName) -
      CACHE_NAMES_SORTED_BY_RFC_9211.indexOf(b.cacheName)
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
          hit: parametersByKey.has('hit'),
          fwd: parametersByKey.get('fwd') as ParsedCacheStatusEntry['parameters']['fwd'],
          'fwd-status': parametersByKey.has('fwd-status')
            ? Number(parametersByKey.get('fwd-status'))
            : undefined,
          ttl: parametersByKey.has('ttl') ? Number(parametersByKey.get('ttl')) : undefined,
          stored: parametersByKey.has('stored'),
          collapsed: parametersByKey.has('collapsed'),
          key: parametersByKey.get('key'),
          detail: parametersByKey.get('detail'),
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
