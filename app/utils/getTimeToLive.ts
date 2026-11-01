/**
 * Remaining TTL in seconds, or `undefined` when the headers carry no expiry information.
 *
 * `max-age` takes precedence over `Expires` (RFC 9111), and `Date` anchors the age of the response
 * when there is no `Age` header.
 */
export const getTimeToLive = (
  age: number | undefined,
  date: Date | undefined,
  expiresAt: Date | undefined,
  maxAge: number | null,
  now: number,
): number | undefined => {
  if (maxAge != null) {
    const elapsed = age ?? (date != null ? (now - date.getTime()) / 1000 : 0)
    return maxAge - elapsed
  }

  // With both absolute dates, remaining lifetime is their difference minus the age. `now` is
  // irrelevant, so don't fall back to it.
  if (date != null && expiresAt != null) {
    return (expiresAt.getTime() - date.getTime()) / 1000 - (age ?? 0)
  }

  // Without `Date`, `Expires` is only comparable to `now`.
  if (expiresAt != null) {
    return (expiresAt.getTime() - now) / 1000
  }
}
