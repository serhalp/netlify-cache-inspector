export type Freshness =
  | { state: 'fresh' }
  // `staleWhileRevalidateTtl` is the time left in which a stale response may still be served
  // while it is revalidated in the background.
  | { state: 'stale-while-revalidate'; staleWhileRevalidateTtl: number }
  // `staleServingProhibitedBy` names the directive (e.g. `must-revalidate`) that made a
  // `stale-while-revalidate` window inert.
  | { state: 'stale'; staleServingProhibitedBy?: string }

/**
 * Determines whether a response is still fresh, stale but servable under its
 * `stale-while-revalidate` window, or fully stale. All values are in seconds.
 */
export const getFreshness = (
  ttl: number | undefined,
  staleWhileRevalidate: number | undefined,
  staleServingProhibitedBy?: string,
): Freshness | undefined => {
  if (ttl == null) return undefined
  if (ttl > 0) return { state: 'fresh' }

  if (staleWhileRevalidate != null) {
    // RFC 9111 §4.2.4: these directives forbid serving stale regardless of any SWR window.
    if (staleServingProhibitedBy != null) return { state: 'stale', staleServingProhibitedBy }

    const staleWhileRevalidateTtl = ttl + staleWhileRevalidate
    if (staleWhileRevalidateTtl > 0) {
      return { state: 'stale-while-revalidate', staleWhileRevalidateTtl }
    }
  }

  return { state: 'stale' }
}
