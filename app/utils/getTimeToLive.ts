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

  const effectiveMaxAge =
    maxAge ??
    (expiresAt != null ? (expiresAt.getTime() - trulyEffectiveDate.getTime()) / 1000 : undefined)

  if (effectiveMaxAge != null) {
    return effectiveMaxAge - effectiveAge
  }
}
