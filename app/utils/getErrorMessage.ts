// Prefer the API's own message (H3 error body) over the generic fetch error text
const getErrorMessage = (err: unknown): string => {
  const e = err as Record<string, unknown> | undefined
  return (
    ((e?.data as Record<string, unknown>)?.message as string) ??
    (typeof e?.toString === 'function' ? e.toString() : null) ??
    `Fetch error: ${err}`
  )
}

export default getErrorMessage
