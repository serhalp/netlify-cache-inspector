// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'node:path'

export default defineNuxtConfig({

  modules: ['@unocss/nuxt', '@nuxt/eslint', '@nuxt/test-utils/module', '@netlify/nuxt'],
  devtools: { enabled: true },

  app: {
    head: {
      title: 'Netlify Cache Inspector',
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
