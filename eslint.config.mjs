// @ts-check
import e18e from '@e18e/eslint-plugin'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt().append(e18e.configs.recommended).override('nuxt/vue/rules', {
  rules: {
    'vue/html-self-closing': [
      'error',
      {
        html: {
          // The default config here isn't compatible with prettier:
          // https://github.com/vuejs/eslint-plugin-vue/issues/2232.
          void: 'always',
        },
      },
    ],
  },
})
