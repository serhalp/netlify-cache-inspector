import { defineConfig, presetUno, presetWebFonts } from 'unocss'

export default defineConfig({
  presets: [
    presetUno({
      dark: 'class',
    }),
    presetWebFonts({
      provider: 'google',
      fonts: {
        mulish: [
          { name: 'Mulish', weights: [400, 500, 700, 800] },
        ],
        mono: [
          { name: 'Roboto Mono', weights: [400, 500] },
        ],
      },
    }),
  ],
  theme: {
    colors: {
      teal: {
        900: '#0C2A2A',
        800: '#014847',
        700: '#016968',
        600: '#02807d',
        500: '#04a29f',
        400: '#05bdba',
        300: '#14d8d4',
        200: '#32e6e2',
        100: '#8efbf7',
        50: '#defffe',
      },
      blue: {
        900: '#1b205b',
        800: '#2036a1',
        700: '#2e51ed',
        600: '#316bf4',
        500: '#5d8df5',
        400: '#80abfa',
        300: '#9cbef6',
        200: '#b5d2fb',
        100: '#cde2ff',
        50: '#edf4ff',
      },
      neutral: {
        900: '#111213',
        800: '#181A1C',
        700: '#353A3E',
        600: '#545A61',
        500: '#778089',
        400: '#9DA7B2',
        300: '#D1D5DA',
        200: '#E9EBED',
        100: '#F6F6F7',
        50: '#FFFFFF',
      },
      red: { 500: '#fe4e5c', 400: '#ff7a84' },
      gold: { 300: '#fbb13d' },
      green: { 400: '#3ac364' },
    },
    fontFamily: {
      heading: ['Pacaembu', 'Poppins', 'sans-serif'],
      body: ['Mulish', 'sans-serif'],
      mono: ['Roboto Mono', 'monospace'],
    },
  },
  shortcuts: {
    'btn': 'inline-flex items-center justify-center px-6 py-2.5 font-body font-700 text-sm rounded-full border-none transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-px focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2',
    'btn-primary': 'btn bg-teal-400 text-teal-900 hover:bg-teal-300',
    'btn-secondary': 'btn bg-transparent text-neutral-600 ring-1 ring-neutral-300 hover:ring-neutral-400 hover:text-neutral-800 dark:text-neutral-300 dark:ring-neutral-600 dark:hover:ring-neutral-400 dark:hover:text-neutral-200',
    'mono-label': 'font-mono text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-400 font-500',
  },
  preflights: [
    {
      getCSS: () => `
        @font-face {
          font-family: 'Pacaembu';
          src: url('https://example-styles.netlify.app/fonts/PacaembuVar-latin.woff2') format('woff2');
          font-weight: 100 900;
          font-display: swap;
          font-style: normal;
        }
      `,
    },
  ],
})
