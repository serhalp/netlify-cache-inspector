// Prefer the API's own message (H3 error body) over the generic fetch error text
const getErrorMessage = (err: unknown): string =>
  (err as { data?: { message?: string } } | undefined)?.data?.message ?? String(err)

export default getErrorMessage
