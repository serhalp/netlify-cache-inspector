// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'node:path'

export default defineNuxtConfig({
  modules: [
    '@unocss/nuxt',
    '@nuxt/eslint',
    '@nuxt/test-utils/module',
    '@netlify/nuxt',
  ],
  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Netlify Cache Inspector',
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon-96x96.png',
          sizes: '96x96',
        },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      meta: [
        { name: 'description', content: 'Inspect and compare HTTP cache headers on Netlify sites. Analyze cache status, CDN behavior, and cache-control directives.' },
        { name: 'apple-mobile-web-app-title', content: 'ntlcache' },
      ],
      script: [
        {
          // Prevent FOUC: apply dark class before first paint
          innerHTML: `(function(){try{var m=localStorage.getItem('color-mode');if(m==='dark'||(m!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
        },
      ],
    },
  },

  alias: {
    '~server': resolve(__dirname, './server'),
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
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2024-09-13',

  eslint: {
    config: {
      stylistic: true,
    },
  },
})
