# Architecture

## Project structure

Nuxt 4, with the new `app/` directory structure.

```
app/
  components/       Vue components (with co-located .test.ts files)
  composables/      Reusable Vue composables
  pages/            File-based routing
  types/            TypeScript type definitions
  utils/            Pure utility functions (with co-located .test.ts files)
  app.vue           Root layout (header, footer, color mode)
server/
  api/              Nuxt server API routes
  db.ts             Netlify Blobs storage layer
uno.config.ts       UnoCSS theme, colors, fonts, shortcuts
```

## Data flow

1. `RequestForm.vue` emits a URL
2. `useRunManager.ts` calls `POST /api/inspect-url`
3. The server fetches the URL with `x-nf-debug-logging: 1`, validates the response is from Netlify (`X-NF-Request-Id` header), saves it to Netlify Blobs, and returns an `ApiRun`
4. `useRunManager` transforms `ApiRun` to `Run` by filtering headers to cache-relevant ones via `getCacheHeaders()`
5. `RunDisplay.vue` renders a `RunPanel.vue` for each run
6. `RunPanel.vue` renders `CacheAnalysis.vue`, which calls `getCacheAnalysis()` to produce structured analysis

### Key types

- `ApiRun` (server response): `{ runId, url, status, headers, durationInMs }`
- `Run` (frontend): `{ runId, url, status, cacheHeaders, durationInMs }`

## Cache analysis pipeline

`getCacheAnalysis()` orchestrates:

- `parseCacheStatus()` -- parses `Cache-Status` header per RFC 9211 into per-layer results
- `getServedBy()` -- determines response source (CDN edge, durable cache, function, edge function)
- `parseCacheControl()` -- parses `Cache-Control`, `CDN-Cache-Control`, and debug headers into TTLs for browser, CDN, and Netlify CDN tiers
- `getTimeToLive()` -- calculates remaining cache lifetime from age, date, expires, and max-age

## Composables

**`useRunManager`** -- manages run state (`runs`, `error`, `loading`), handles API calls, and exposes methods for adding/clearing runs.

**`useDataHover`** -- powers cross-panel hover diffing. Uses module-level shared state (not per-instance) so all panels read the same hover. Supports delta calculation for numeric values and dates.

**`useColorMode`** -- manages light/dark/system mode with localStorage persistence. A FOUC-prevention inline script in `nuxt.config.ts` applies the dark class before first paint.

## Server

Two API routes:

- `POST /api/inspect-url` -- fetches a URL with debug headers, validates it's Netlify, persists to Blobs, returns `ApiRun`
- `GET /api/runs/:runId` -- retrieves a persisted run by ID

Storage uses Netlify Blobs (`server/db.ts`). Run IDs are 8-character SHA256 hashes of `${url}-${timestamp}`.

## Styling

UnoCSS with a custom Netlify-inspired color theme defined in `uno.config.ts`. Shortcuts (`btn`, `btn-primary`, `btn-secondary`, `mono-label`) provide reusable component patterns. Fonts: Pacaembu (headings), Mulish (body), Roboto Mono (code).

Dark mode uses class-based toggling: `:is(.dark)` selectors in scoped CSS for component styles, `dark:` prefix for UnoCSS utilities.

## Permalink system

Runs are persisted to Netlify Blobs on creation. The `/run/[runId]` page loads a run via the API and pre-populates the form with that run's URL, so users can immediately re-run for comparison.

## Path aliases

`~server` resolves to `./server/` for server-side imports.
