import type { KnipConfig } from 'knip'

export default {
  // knip's Nuxt plugin doesn't support the Nuxt 5 app/ directory convention yet.
  // Note: custom entry replaces (not merges with) the plugin defaults.
  nuxt: {
    entry: [
      'app/app.vue',
      'app/error.vue',
      'app/pages/**/*.vue',
      'app/components/**/*.vue',
      'app/composables/**/*.ts',
      'app/utils/**/*.ts',
      'app/layouts/**/*.vue',
      'app/middleware/**/*.ts',
      'server/api/**/*.ts',
      'server/routes/**/*.ts',
      'server/middleware/**/*.ts',
      'server/plugins/**/*.ts',
      'server/**/*.ts',
    ],
    config: ['nuxt.config.ts'],
  },
  ignoreFiles: ['uno.config.ts'],
  // `ofetch` is a Nitro-provided implicit server dependency. Declaring it directly would
  // install a second copy that bypasses the one Nitro routes to.
  ignoreDependencies: ['vue', 'vue-router', 'vue-tsc', 'vitest-environment-nuxt', 'ofetch'],
  ignoreBinaries: ['zizmor'],
} satisfies KnipConfig
