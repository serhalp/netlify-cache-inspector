// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import vueA11y from 'eslint-plugin-vuejs-accessibility'

export default withNuxt(
  vueA11y.configs['flat/recommended'],
).override('nuxt/vue/rules', {
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
