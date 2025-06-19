# Copilot & AI Agent Instructions

This file provides comprehensive project-specific guidance for GitHub Copilot, AI coding agents, and future contributors working on the Netlify Cache Inspector.

## Tech Stack & Architecture

This is a **Nuxt 3** application with the following key technologies:
- **Frontend**: Vue 3 with Composition API, TypeScript
- **Backend**: Nuxt server API routes
- **Testing**: Vitest with Vue Test Utils, jsdom environment
- **Linting**: ESLint with @nuxt/eslint configuration
- **Deployment**: Netlify with automatic deployments
- **Node.js**: Requires >= 20.0.0

### Project Structure
```
app/                 # Vue components, pages, utils (client-side)
  components/        # Vue components
  pages/            # Nuxt pages (file-based routing)
  utils/            # Client-side utilities
server/             # Server-side code
  api/              # API endpoints
  db.ts            # Database utilities
.github/            # GitHub workflows and configurations
```

## Package Management

- **Use `pnpm`, not `npm` or `yarn`** for all operations
- The presence of `pnpm-lock.yaml` indicates this project uses pnpm
- **Never** generate or update `package-lock.json` or `yarn.lock` files
- Example commands:
  ```bash
  pnpm install
  pnpm run dev
  pnpm run build
  pnpm run test
  ```

## Development Workflow

### Essential Commands
- `pnpm run dev` - Start development server on http://localhost:3000
- `pnpm run build` - Build for production
- `pnpm run test` - Run full test suite (typecheck + lint + unit tests)
- `pnpm run test:unit` - Run unit tests only
- `pnpm run lint` - Run ESLint
- `pnpm run lint:fix` - Fix ESLint issues automatically
- `pnpm run typecheck` - Run TypeScript type checking

### Before Submitting Code
Always run the complete test suite: `pnpm run test`
This includes type checking, linting, and unit tests.

## Code Style & Conventions

### TypeScript
- All files should use TypeScript (`.ts`, `.vue` with `<script setup lang="ts">`)
- Leverage Nuxt's auto-imports - avoid explicit imports for Nuxt/Vue composables
- Use explicit imports for external libraries and local utilities

### Vue Components
- Use **Composition API** with `<script setup lang="ts">`
- Define props with `defineProps<{}>()` for type safety
- Use `defineEmits` for event handling
- Example component structure:
  ```vue
  <script setup lang="ts">
  const props = defineProps<{
    loading?: boolean
  }>()
  
  const emit = defineEmits(['submit'])
  
  // Component logic here
  </script>
  
  <template>
    <!-- Template here -->
  </template>
  
  <style scoped>
  /* Scoped styles here */
  </style>
  ```

### ESLint Configuration
- Uses @nuxt/eslint with stylistic rules enabled
- Custom rule: Vue self-closing tags should always be self-closing for void HTML elements
- Run `pnpm run lint:fix` to auto-fix issues

## Testing

### Framework
- **Vitest** for unit testing
- **Vue Test Utils** for component testing
- **jsdom** environment for DOM testing

### Test File Patterns
- Test files should be named `*.test.ts` 
- Place component tests next to components: `components/ComponentName.test.ts`
- Place utility tests next to utilities: `utils/utilName.test.ts`

### Test Structure
```typescript
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ComponentName from './ComponentName.vue'

describe('ComponentName', () => {
  it('should do something', () => {
    const wrapper = mount(ComponentName)
    expect(wrapper.text()).toBe('expected text')
  })
})
```

## API Development

### Server Routes
- Place API routes in `server/api/`
- Use `.post.ts`, `.get.ts`, etc. for HTTP method-specific handlers
- Use Nuxt's `defineEventHandler` for route handlers
- Example API route:
  ```typescript
  export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    // API logic here
    return { result: 'success' }
  })
  ```

### Error Handling
- Use `createError()` for API errors with proper status codes
- Validate inputs and provide clear error messages

## File Organization

### Where to Put Things
- **Vue Components**: `app/components/ComponentName.vue`
- **Pages**: `app/pages/page-name.vue` (uses file-based routing)
- **Client Utilities**: `app/utils/utilityName.ts`
- **API Endpoints**: `server/api/endpoint-name.post.ts`
- **Server Utilities**: `server/utilityName.ts`
- **Tests**: Next to the file being tested with `.test.ts` suffix

### Naming Conventions
- **Components**: PascalCase (`RequestForm.vue`)
- **Pages**: kebab-case (`cache-analysis.vue`)
- **Utilities**: camelCase (`getCacheAnalysis.ts`)
- **API Routes**: kebab-case (`inspect-url.post.ts`)

## Deployment & CI/CD

### Netlify Configuration
- Builds with `pnpm run build`
- Publishes `dist/` directory
- Uses Netlify Functions for server-side functionality
- Configuration in `netlify.toml`

### GitHub Actions
- Runs on every push and PR
- Executes: lint → typecheck → unit tests → build
- Uses Node.js 22.x and pnpm via corepack

## Common Gotchas

### Dependencies
- Use corepack to enable pnpm: `corepack enable`
- Always check `package.json` engines field for Node.js version requirements

### Nuxt Specifics
- Leverage auto-imports for Vue, Nuxt, and project composables
- Use `~server` alias for server-side imports in server code
- Server and client code are separate - be mindful of where code runs

### TypeScript
- Currently using TypeScript 5.8.3 which triggers ESLint warnings (safe to ignore)
- Nuxt generates types automatically in `.nuxt/` directory

## AI Agent Guidelines

### Automated Detection
- Detect `pnpm-lock.yaml` → automatically use pnpm
- Detect `nuxt.config.ts` → recognize as Nuxt 3 project
- Detect `vitest.config.ts` → use Vitest for testing

### Best Practices for AI
- Always run tests after making changes
- Respect existing code patterns and file organization
- Use TypeScript strictly - no `any` types without justification
- Follow Vue 3 Composition API patterns consistently
- Check ESLint output and fix issues

---

_Last updated: 2025-01-20_