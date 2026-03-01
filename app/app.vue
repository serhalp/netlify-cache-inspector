<script setup lang="ts">
const { resolvedMode } = useColorMode()
</script>

<template>
  <NuxtRouteAnnouncer />

  <div class="app-shell font-body text-neutral-800 dark:text-neutral-200">
    <header class="header-bar">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <NuxtLink to="/" class="flex items-center gap-3 no-underline group">
          <img
            :src="resolvedMode === 'dark' ? '/logo-dark.png' : '/logo-light.png'"
            alt="Netlify Cache Inspector"
            class="h-7 flex-shrink-0"
          />
          <span
            class="font-heading font-bold text-lg tracking-tight text-neutral-800 dark:text-neutral-50 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors"
          >
            Netlify Cache Inspector
          </span>
        </NuxtLink>

        <div class="flex items-center gap-3">
          <HelpButton />
          <ColorModeToggle />
        </div>
      </div>
    </header>

    <main class="w-full max-w-6xl mx-auto px-6 py-10">
      <NuxtPage />
    </main>

    <footer class="footer-bar">
      <div
        class="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-sm"
      >
        <nav class="flex items-center gap-5">
          <a
            href="https://www.netlify.com"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link"
            >Netlify</a
          >
          <a
            href="https://docs.netlify.com/platform/caching/"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link"
            >Caching docs</a
          >
        </nav>
        <span class="text-neutral-600 dark:text-neutral-400">
          Made by
          <a
            href="https://philippeserhal.com"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link"
            >Philippe Serhal</a
          >
        </span>
      </div>
    </footer>
  </div>
</template>

<style>
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f6f6f7;
  transition: background-color 0.3s ease;
}

.app-shell > main {
  flex: 1;
}

:is(.dark) .app-shell {
  background: linear-gradient(165deg, #0d1818 0%, #0c2a2a 50%, #0d1818 100%);
  background-attachment: fixed;
}

.header-bar {
  border-bottom: 1px solid #e9ebed;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 50;
}

:is(.dark) .header-bar {
  border-bottom: 1px solid rgba(208, 255, 254, 0.08);
  background: rgba(13, 24, 24, 0.85);
}

.footer-bar {
  border-top: 1px solid #e9ebed;
  margin-top: auto;
}

:is(.dark) .footer-bar {
  border-top: 1px solid rgba(208, 255, 254, 0.08);
}

.footer-link {
  color: #016968;
  text-decoration: underline;
  text-decoration-color: rgba(1, 105, 104, 0.4);
  text-underline-offset: 2px;
  transition: all 0.15s ease;
}

.footer-link:hover {
  color: #014847;
  text-decoration-color: #014847;
}

:is(.dark) .footer-link {
  color: #32e6e2;
  text-decoration-color: rgba(50, 230, 226, 0.4);
}

:is(.dark) .footer-link:hover {
  color: #8efbf7;
  text-decoration-color: #8efbf7;
}
</style>
