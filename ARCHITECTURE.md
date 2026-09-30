# Architecture

## Project structure

Nuxt 5, with the `app/` directory structure.

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
  db.ts             Netlify Blobs storage layer (runs and reports)
  reports.ts        Report ID generation and request validation
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
- `ApiReport` (server response): `{ reportId, runIds }`; `GET /api/reports/:reportId` also includes `runs: ApiRun[]`

## Cache analysis pipeline

`getCacheAnalysis()` orchestrates:

- `parseCacheStatus()` -- parses `Cache-Status` header per RFC 9211 into per-layer results
- `getServedBy()` -- determines response source (CDN edge, durable cache, function, edge function)
- `parseCacheControl()` -- parses `Cache-Control`, `CDN-Cache-Control`, and debug headers into TTLs for browser, CDN, and Netlify CDN tiers
- `getTimeToLive()` -- calculates remaining cache lifetime from age, date, expires, and max-age

## Composables

**`useRunManager`** -- manages run state (`runs`, `reportId`, `error`, `loading`) in Nuxt `useState` so it survives navigation, handles API calls, and keeps the URL in sync with the runs on screen (see _Permalink system_). `loadRun()` / `loadReport()` populate state for the permalink pages and skip the fetch when the state already matches the route.

**`useDataHover`** -- powers cross-panel hover diffing. Uses module-level shared state (not per-instance) so all panels read the same hover. Supports delta calculation for numeric values and dates.

**`useColorMode`** -- manages light/dark/system mode with localStorage persistence. A FOUC-prevention inline script in `nuxt.config.ts` applies the dark class before first paint.

## Server

Four API routes:

- `POST /api/inspect-url` -- fetches a URL with debug headers, validates it's Netlify, persists to Blobs, returns `ApiRun`
- `GET /api/runs/:runId` -- retrieves a persisted run by ID
- `POST /api/reports` -- persists an ordered list of existing run IDs as a report, returns `ApiReport`
- `GET /api/reports/:reportId` -- retrieves a report with its runs resolved

Storage uses Netlify Blobs (`server/db.ts`) with two stores, `runs` and `reports`. Run IDs are 8-character SHA256 hashes of `${url}-${timestamp}`. Report IDs are 12-character SHA256 hashes of the ordered run ID list, so reports are content-addressed: saving the same run set twice yields the same ID and is a no-op. A report stores only run IDs; runs are resolved on read.

## Styling

UnoCSS with a custom Netlify-inspired color theme defined in `uno.config.ts`. Shortcuts (`btn`, `btn-primary`, `btn-secondary`, `mono-label`) provide reusable component patterns. Fonts: Pacaembu (headings), Mulish (body), Roboto Mono (code).

Dark mode uses class-based toggling: `:is(.dark)` selectors in scoped CSS for component styles, `dark:` prefix for UnoCSS utilities.

## Permalink system

Runs are persisted to Netlify Blobs on creation and are immutable. The URL always identifies what is on screen, and `useRunManager.syncRoute()` navigates after every change:

| Runs on screen | Route                |
| -------------- | -------------------- |
| 0              | `/`                  |
| 1              | `/run/[runId]`       |
| 2 or more      | `/report/[reportId]` |

Reports are immutable and content-addressed, and there is no update endpoint. Adding a run to a report someone shared with you therefore produces a new report with a new URL (copy-on-write) through the same `POST /api/reports` call that created the original; the shared URL keeps showing the original runs. Navigation uses history pushes, so Back steps through previous snapshots.

The `/run/[runId]` and `/report/[reportId]` pages load their data via the API, then pre-populate the form with a run URL so users can immediately re-run for comparison. The home page resets the shared state so it always starts empty.

## Path aliases

`~server` resolves to `./server/` for server-side imports.
