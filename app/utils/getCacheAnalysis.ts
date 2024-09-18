export enum ServedBy {
  CDN = "CDN",
  DurableCache = "Durable Cache",
  Function = "Function",
  EdgeFunction = "Edge Function",
}

interface ParsedCacheStatusEntry {
  cacheName: string;
  parameters: {
    hit: boolean;
    fwd?:
    | "bypass"
    | "method"
    | "uri-miss"
    | "vary-miss"
    | "miss"
    | "request"
    | "stale"
    | "partial";
    "fwd-status"?: number;
    ttl?: number;
    stored?: boolean;
    collapsed?: boolean;
    key?: string;
    detail?: string;
  };
}
export const parseCacheStatus = (
  // See https://httpwg.org/specs/rfc9211.html
  // example string:
  // "\"Next.js\"; hit, \"Netlify Durable\"; fwd=miss; stored, \"Netlify Edge\"; fwd=miss"
  cacheStatus: string,
): ParsedCacheStatusEntry[] => {
  return (
    cacheStatus
      .split(", ")
      .map((entry): null | ParsedCacheStatusEntry => {
        const [cacheName, ...parameters] = entry.split("; ");
        if (!cacheName || parameters.length === 0) {
          console.warn("Ignoring invalid cache status entry", { entry });
          return null;
        }

        const parametersByKey = new Map(
          parameters
            .map((parameter) => {
              const [key, value] = parameter.split("=");
              if (!key || !value) {
                console.warn("Ignoring invalid cache status entry", { entry });
                return null;
              }
              return [key, value];
            })
            .filter((kv): kv is [string, string] => kv != null),
        );
        return {
          cacheName: cacheName.slice(1, -1), // "Netlify Edge" -> Netlify Edge
          parameters: {
            hit: parametersByKey.has("hit"),
            fwd: parametersByKey.get(
              "fwd",
            ) as ParsedCacheStatusEntry["parameters"]["fwd"],
            "fwd-status": Number(parametersByKey.get("fwd-status")),
            ttl: Number(parametersByKey.get("ttl")),
            stored: parametersByKey.has("stored"),
            collapsed: parametersByKey.has("collapsed"),
            key: parametersByKey.get("key"),
            detail: parametersByKey.get("detail"),
          },
        };
      })
      .filter((e): e is ParsedCacheStatusEntry => e != null)
      // Per the spec, these are sorted from "the cache closest to the origin server" to "the cache closest to the user".
      // As a user interpreting what happened, you want these to start from yourself.
      .toReversed()
  );
};

const getServedBy = (
  cacheHeaders: Headers,
  cacheStatus: ParsedCacheStatusEntry[],
): ServedBy => {
  // Per the spec, these are sorted from "the cache closest to the origin server" to "the cache closest to the user".
  // So, the first cache hit (starting from the user) is the one that served the request.
  // But we don't quite want to return exactly the same concept of "caches" as in `Cache-Status`, so
  // we need a bit of extra logic to map to other sources.
  for (const {
    cacheName,
    parameters: { hit },
  } of cacheStatus) {
    if (!hit) continue;

    if (cacheName === "Netlify Edge") return ServedBy.CDN;
    if (cacheName === "Netlify Durable") return ServedBy.DurableCache;
  }

  // NOTE: the order is important here, since a response can be served by a Function even
  // though one or more Edge Functions are also invoked (as middleware).
  if (cacheHeaders.has("X-NF-Function-Type")) return ServedBy.Function;

  if (cacheHeaders.has("X-NF-Edge-Functions")) return ServedBy.EdgeFunction;

  throw new Error(
    `Could not determine who served the request. Cache status: ${cacheStatus}`,
  );
};

export interface CacheAnalysis {
  servedBy: ServedBy;
  cacheStatus: ParsedCacheStatusEntry[];
}

export default function getCacheAnalysis(
  cacheHeadersObj: Record<string, string>,
): CacheAnalysis {
  // Use a Headers instance for case insensitivity and multi-value handling
  const cacheHeaders = new Headers(cacheHeadersObj);
  const cacheStatus = parseCacheStatus(cacheHeaders.get("Cache-Status") ?? "");

  return {
    servedBy: getServedBy(cacheHeaders, cacheStatus),
    cacheStatus,
  };
}
