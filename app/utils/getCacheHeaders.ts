const CACHE_HEADER_NAMES = [
  "Age",
  "CDN-Cache-Control",
  "Cache-Control",
  "Cache-Status",
  "Cache-Tag",
  "Content-Encoding",
  "Content-Language",
  "Content-Type",
  "Date",
  "ETag",
  "Netlify-CDN-Cache-Control",
  "Netlify-Cache-Tag",
  "Netlify-Vary",
  "Vary",
  "X-BB-Deploy-Id",
  "X-BB-Gen",
  "X-BB-Host-Id",
  "X-NF-Cache-Info",
  "X-NF-Cache-Result",
  // TODO(serhalp) These two probably shouldn't be here but I use it to determine who served the
  // request. Need to refactor to pass the whole headers obj to `getServedBy` to remove this.
  "X-NF-Edge-Functions",
  "X-NF-Function-Type",
  "X-Nextjs-Cache",
];

// TODO(serhalp) Magically parse `Netlify-Vary` if present and also include headers referenced by it
export default function getCacheHeaders(headersObj: Record<string, string>) {
  // Use a Headers instance for case insensitivity and multi-value handling
  const headers = new Headers(headersObj);

  // I'd rather avoid mutations here but it's really awkward to handle nil values otherwise
  const cacheHeaders = new Headers();
  for (const name of CACHE_HEADER_NAMES) {
    const val = headers.get(name);
    if (val != null) cacheHeaders.set(name, val);
  }

  return Object.fromEntries(cacheHeaders);
}
