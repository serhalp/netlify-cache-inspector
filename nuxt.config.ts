// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'node:path'

export default defineNuxtConfig({
  compatibilityDate: '2024-09-13',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

  app: {
    head: {
      link: [
        // See https://example-styles.netlify.app/.
        {
          rel: 'preload',
          href: 'https://example-styles.netlify.app/fonts/PacaembuVar-latin.woff2',
          as: 'font',
          type: 'font/woff2',
          crossorigin: '',
        },
        {
          rel: 'preload',
          href: 'https://example-styles.netlify.app/fonts/MulishVar-latin.woff2',
          as: 'font',
          type: 'font/woff2',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://example-styles.netlify.app/styles.css',
        },
        {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@latest/build/styles/default.min.css',
        },
      ],
      script: [
        {
          src: 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@latest/build/highlight.min.js',
        },
        {
          onload: `hljs.highlightAll()`,
        },
      ],
    },
  },

  routeRules: {
    '/': {
      prerender: true,
    },
    '/run/**': {
      // Cache each run page, since they're immutable other than new deploys
      headers: {
        'cache-control': 'public, max-age=0, must-revalidate',
      },
    },
  },

  modules: ['@nuxt/eslint', '@nuxt/test-utils/module'],

  eslint: {
    config: {
      stylistic: true,
    },
  },

  alias: {
    '~server': resolve(__dirname, './server'),
  },
})
