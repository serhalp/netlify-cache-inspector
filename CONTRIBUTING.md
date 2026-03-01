# Contributing

## Prerequisites

- Node.js >= 20
- pnpm (can be enabled via `corepack enable`; pinned version in `packageManager` field)

Never use npm or yarn.

## Development

```sh
pnpm install
pnpm run dev    # http://localhost:3000
```

## Commands

| Command             | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `pnpm dev`          | Dev server                                         |
| `pnpm build`        | Production build                                   |
| `pnpm test`         | Full suite: typecheck + lint + format + unit tests |
| `pnpm test:unit`    | Unit tests only                                    |
| `pnpm typecheck`    | TypeScript type checking                           |
| `pnpm lint`         | Oxlint check                                       |
| `pnpm lint:fix`     | Oxlint auto-fix                                    |
| `pnpm format`       | Format with oxfmt                                  |
| `pnpm format:check` | Check formatting                                   |
| `pnpm knip`         | Check for unused exports/dependencies              |

Run a single test file:

```sh
pnpm vitest run app/utils/getCacheAnalysis.test.ts
```

**Always run `pnpm run test` before submitting code.**

## Testing

- **Vitest** with **happy-dom** environment
- Tests are co-located: `ComponentName.test.ts` next to `ComponentName.vue`
- Each test file needs a `@vitest-environment happy-dom` docblock
- `NuxtLink` is stubbed in component tests; `$fetch` is mocked on `global`

## Code conventions

- Vue Composition API with `<script setup lang="ts">`
- **Oxlint** for linting (`oxlint.config.ts`), **oxfmt** for formatting (`.oxfmtrc.json`)
- No `any` without justification

### Commits

[Conventional Commits](https://www.conventionalcommits.org/) required for all commits and PR titles: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, etc.

### Styling

UnoCSS utility classes and shortcuts (defined in `uno.config.ts`). Component-specific styles use scoped CSS. Dark mode uses `:is(.dark)` selectors in scoped styles and `dark:` prefix for UnoCSS utilities.
