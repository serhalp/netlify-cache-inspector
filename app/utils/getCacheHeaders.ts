const CACHE_HEADER_NAMES = [
  'Age',
  'CDN-Cache-Control',
  'Cache-Control',
  'Cache-Status',
  'Cache-Tag',
  'Content-Encoding',
  'Content-Language',
  'Content-Type',
  'Date',
  'ETag',
  'Debug-Netlify-CDN-Cache-Control',
  'Netlify-Cache-Tag',
  'Netlify-Vary',
  'Vary',
  'Debug-X-BB-Deploy-Id',
  'Debug-X-BB-Gen',
  'Debug-X-BB-Host-Id',
  'Debug-X-NF-Cache-Key',
  'Debug-X-NF-Cache-Info',
  'Debug-X-NF-Cache-Result',
  'Debug-X-NF-Durable-Cache-Result',
  // TODO(serhalp) These two probably shouldn't be here but I use it to determine who served the
  // request. Need to refactor to pass the whole headers obj to `getServedBy` to remove this.
  'Debug-X-NF-Edge-Functions',
  'Debug-X-NF-Function-Type',
  'Debug-X-NF-Request-Id',
  'X-Nextjs-Cache',
  'X-Nextjs-Date',
]

// TODO(serhalp) Magically parse `Netlify-Vary` if present and also include headers referenced by it
export default function getCacheHeaders(headersObj: Record<string, string>) {
  // Use a Headers instance for case insensitivity and multi-value handling
  const headers = new Headers(headersObj)

  // I'd rather avoid mutations here but it's really awkward to handle nil values otherwise
  const cacheHeaders = new Headers()
  for (const name of CACHE_HEADER_NAMES) {
    const val = headers.get(name)
    if (val != null) cacheHeaders.set(name, val)
  }

  return Object.fromEntries(cacheHeaders)
}
