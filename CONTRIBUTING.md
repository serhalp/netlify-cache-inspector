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

### GitHub Actions security analysis

CI runs [zizmor](https://docs.zizmor.sh/) against the repository's GitHub Actions workflows. The
shared policy lives in `.github/zizmor.yml`, and the `zizmor` task uses the same pedantic persona as
CI.

You may run it locally by [installing `zizmor`](https://docs.zizmor.sh/installation/) and running:

```bash
pnpm run zizmor
```

Some audits resolve action refs and vulnerability metadata through GitHub. To run those online
checks locally, authenticate with the GitHub CLI and pass its token:

```bash
GH_TOKEN="$(gh auth token)" pnpm run zizmor
```

To fix audit findings automatically, run:

```bash
GH_TOKEN="$(gh auth token)" pnpm run zizmor:fix
```
