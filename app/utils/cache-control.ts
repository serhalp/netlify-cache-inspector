/**
 * This is blatantly lifted from https://github.com/tusbar/cache-control.
 * No libraries I could find did quite what I wanted. This one was close, but quietly ignored
 * extensions (e.g. `durable`), so I just made that change (and I removed `format()` because I
 * didn't need it).
 *
 * TODO(serhalp) Fork instead of inlining? Open a PR?
 */

const HEADER_REGEXP =
  /([a-zA-Z][a-zA-Z_-]*)\s*(?:=(?:"([^"]*)"|([^ \t",;]*)))?/g;

const SUPPORTED_DIRECTIVES = {
  maxAge: "max-age",
  sharedMaxAge: "s-maxage",
  maxStale: "max-stale",
  minFresh: "min-fresh",
  immutable: "immutable",
  mustRevalidate: "must-revalidate",
  noCache: "no-cache",
  noStore: "no-store",
  noTransform: "no-transform",
  onlyIfCached: "only-if-cached",
  private: "private",
  proxyRevalidate: "proxy-revalidate",
  public: "public",
  staleWhileRevalidate: "stale-while-revalidate",
  staleIfError: "stale-if-error",
};

function parseBooleanOnly(value: string | null | undefined) {
  return value === null;
}

function parseDuration(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const duration: number = Number.parseInt(value, 10);

  if (!Number.isFinite(duration) || duration < 0) {
    return null;
  }

  return duration;
}

export class CacheControl {
  maxAge: number | null;
  sharedMaxAge: number | null;
  maxStale: boolean | null;
  maxStaleDuration: number | null;
  minFresh: number | null;
  immutable: boolean | null;
  mustRevalidate: boolean | null;
  noCache: boolean | null;
  noStore: boolean | null;
  noTransform: boolean | null;
  onlyIfCached: boolean | null;
  private: boolean | null;
  proxyRevalidate: boolean | null;
  public: boolean | null;
  staleWhileRevalidate: number | null;
  staleIfError: number | null;
  extensions: Record<string, string | null>;

  constructor() {
    this.maxAge = null;
    this.sharedMaxAge = null;
    this.maxStale = null;
    this.maxStaleDuration = null;
    this.minFresh = null;
    this.immutable = null;
    this.mustRevalidate = null;
    this.noCache = null;
    this.noStore = null;
    this.noTransform = null;
    this.onlyIfCached = null;
    this.private = null;
    this.proxyRevalidate = null;
    this.public = null;
    this.staleWhileRevalidate = null;
    this.staleIfError = null;
    this.extensions = {};
  }

  parse(header: string | null | undefined): this {
    if (!header || header.length === 0) {
      return this;
    }

    const values: Record<string, string | null> = {};
    const matches = header.match(HEADER_REGEXP) ?? [];

    for (const match of matches) {
      const tokens: string[] = match.split("=", 2);
      const [key] = tokens;

      if (key == null) {
        throw new Error("Invalid Cache-Control header");
      }

      values[key.toLowerCase()] = tokens[1] != null ? tokens[1].trim() : null;
    }

    this.maxAge = parseDuration(values[SUPPORTED_DIRECTIVES.maxAge]);
    this.sharedMaxAge = parseDuration(
      values[SUPPORTED_DIRECTIVES.sharedMaxAge],
    );

    this.maxStale = parseBooleanOnly(values[SUPPORTED_DIRECTIVES.maxStale]);
    this.maxStaleDuration = parseDuration(
      values[SUPPORTED_DIRECTIVES.maxStale],
    );
    if (this.maxStaleDuration) {
      this.maxStale = true;
    }

    this.minFresh = parseDuration(values[SUPPORTED_DIRECTIVES.minFresh]);

    this.immutable = parseBooleanOnly(values[SUPPORTED_DIRECTIVES.immutable]);
    this.mustRevalidate = parseBooleanOnly(
      values[SUPPORTED_DIRECTIVES.mustRevalidate],
    );
    this.noCache = parseBooleanOnly(values[SUPPORTED_DIRECTIVES.noCache]);
    this.noStore = parseBooleanOnly(values[SUPPORTED_DIRECTIVES.noStore]);
    this.noTransform = parseBooleanOnly(
      values[SUPPORTED_DIRECTIVES.noTransform],
    );
    this.onlyIfCached = parseBooleanOnly(
      values[SUPPORTED_DIRECTIVES.onlyIfCached],
    );
    this.private = parseBooleanOnly(values[SUPPORTED_DIRECTIVES.private]);
    this.proxyRevalidate = parseBooleanOnly(
      values[SUPPORTED_DIRECTIVES.proxyRevalidate],
    );
    this.public = parseBooleanOnly(values[SUPPORTED_DIRECTIVES.public]);
    this.staleWhileRevalidate = parseDuration(
      values[SUPPORTED_DIRECTIVES.staleWhileRevalidate],
    );
    this.staleIfError = parseDuration(
      values[SUPPORTED_DIRECTIVES.staleIfError],
    );

    for (const [key, value] of Object.entries(values)) {
      if (!Object.keys(SUPPORTED_DIRECTIVES).includes(key)) {
        this.extensions[key] = value;
      }
    }

    return this;
  }
}

export function parse(header?: string | null): CacheControl {
  const cc = new CacheControl();
  return cc.parse(header);
}
