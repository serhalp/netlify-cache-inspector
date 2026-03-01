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

    // Cherry-picked from pedantic/restriction
    'no-throw-literal': 'error',
    eqeqeq: ['error', 'smart'],
    'no-prototype-builtins': 'error',
    'no-else-return': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'require-await': 'error',
    'typescript/no-explicit-any': 'error',
    'typescript/no-non-null-assertion': 'error',
    'typescript/only-throw-error': 'error',
    'typescript/no-deprecated': 'error',
    'typescript/consistent-type-imports': 'error',

    ...e18eRules,
  },
  ignorePatterns: ['.nuxt', '.output', 'node_modules', 'dist'],
})
