import { defineConfig } from 'oxlint'
import e18e from '@e18e/eslint-plugin'

// Extract rules from e18e's recommended config (includes modernization, moduleReplacements, performanceImprovements)
const e18eRules = e18e.configs.recommended.rules as Record<string, string>

export default defineConfig({
  categories: {
    correctness: 'error',
    suspicious: 'error',
    perf: 'error',
  },
  jsPlugins: ['@e18e/eslint-plugin'],
  rules: {
    'no-console': ['error', { allow: ['warn', 'error'] }],
    ...e18eRules,
  },
  ignorePatterns: ['.nuxt', '.output', 'node_modules', 'dist'],
})
