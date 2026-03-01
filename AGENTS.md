# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See also: [ARCHITECTURE.md](./ARCHITECTURE.md) for project structure and data flow, [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow and conventions.

## Project Overview

Netlify Cache Inspector is a Nuxt 4 web app for inspecting and comparing HTTP cache headers on Netlify sites. Users submit a URL, the server fetches it with Netlify debug headers (`x-nf-debug-logging: 1`), and the frontend displays structured cache analysis. Multiple runs can be compared side-by-side with hover-based diffing.

## Commands

| Command                 | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `pnpm run dev`          | Dev server on http://localhost:3000                    |
| `pnpm run build`        | Production build                                       |
| `pnpm run test`         | **Full suite**: typecheck + lint + format + unit tests |
| `pnpm run test:unit`    | Unit tests only (vitest)                               |
| `pnpm run typecheck`    | TypeScript type checking                               |
| `pnpm run lint`         | Oxlint check                                           |
| `pnpm run lint:fix`     | Oxlint auto-fix                                        |
| `pnpm run format`       | Format with oxfmt                                      |
| `pnpm run format:check` | Check formatting                                       |
| `pnpm run knip`         | Check for unused exports/dependencies                  |

Run a single test file: `pnpm vitest run app/utils/getCacheAnalysis.test.ts`

**Always run `pnpm run test` before submitting code.**

Package manager is **pnpm** (pinned in `packageManager` field). Enable via `corepack enable`. Never use npm or yarn.

## Architecture

**Nuxt 4** with `future: { compatibilityVersion: 4 }` — frontend code lives under `app/` (not project root).

### Data Flow

1. `RequestForm.vue` emits URL → `useRunManager.ts` composable calls `POST /api/inspect-url`
2. Server (`server/api/inspect-url.post.ts`) fetches the URL with debug headers, validates it's a Netlify site (checks `X-NF-Request-Id`), saves to **Netlify Blobs** (`server/db.ts`), returns `ApiRun`
3. `useRunManager` filters headers via `getCacheHeaders()`, producing a `Run` with only cache-relevant headers
4. `RunDisplay.vue` → `RunPanel.vue` → `CacheAnalysis.vue` renders structured analysis
5. `CacheAnalysis.vue` calls `getCacheAnalysis()` which orchestrates: `parseCacheStatus()`, `getServedBy()`, `parseCacheControl()`, `getTimeToLive()`

### Key Types

- `ApiRun` (from server): `{ runId, url, status, headers, durationInMs }`
- `Run` (frontend): `{ runId, url, status, cacheHeaders, durationInMs }` — headers filtered to cache-relevant subset

### Hover Diff

`useDataHover.ts` uses module-level shared state (not per-instance). When multiple runs exist, hovering a field highlights matching/differing values across panels.

### Permalink

Runs are persisted in Netlify Blobs. `/run/[runId]` page loads a run via `GET /api/runs/:runId`.

### Styling

**UnoCSS** with utility classes and shortcuts defined in `uno.config.ts`. Dark mode uses class-based toggling (`:is(.dark)` selectors in scoped CSS, UnoCSS `dark:` prefix for utilities). The `useColorMode.ts` composable manages light/dark/system mode with localStorage persistence and a FOUC-prevention inline script in `nuxt.config.ts`.

### Path Alias

`~server` resolves to `./server/` for server-side imports.

## Testing

- **Vitest** with **happy-dom** environment (specified via `@vitest-environment happy-dom` docblock in test files)
- **Vue Test Utils** (`mount()`) for component tests
- Tests are co-located: `ComponentName.test.ts` next to `ComponentName.vue`
- Nuxt auto-imports don't work in tests — explicitly import Vue/Nuxt APIs and mock project utils
- `NuxtLink` is stubbed in component tests; `$fetch` is mocked on `global`

## Code Conventions

- Vue Composition API with `<script setup lang="ts">`
- **Oxlint** for linting (`oxlint.config.ts`), **oxfmt** for formatting (`.oxfmtrc.json`)
- Conventional Commits required for all commits and PR titles (`feat:`, `fix:`, `chore:`, etc.)
- No `any` without justification
