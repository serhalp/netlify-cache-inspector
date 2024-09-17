const CACHE_HEADER_NAMES = [
  "Age",
  "CDN-Cache-Control",
  "Cache-Control",
  "Cache-Status",
  "Content-Encoding",
  "Content-Type",
  "Date",
  "ETag",
  "Netlify-CDN-Cache-Control",
  "Vary",
  "X-BB-Deploy-Id",
  "X-BB-Gen",
  "X-NF-Cache-Info",
  "X-NF-Cache-Result",
];

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
