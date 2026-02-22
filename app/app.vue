<script setup lang="ts">
useColorMode()
</script>

<template>
  <NuxtRouteAnnouncer />

  <div class="app-shell font-body text-neutral-800 dark:text-neutral-200">
    <header class="header-bar">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <NuxtLink
          to="/"
          class="flex items-center gap-3 no-underline group"
        >
          <!-- Netlify spark icon -->
          <svg
            class="w-7 h-7 text-teal-400 flex-shrink-0"
            viewBox="0 0 40 40"
            fill="currentColor"
          >
            <path d="M28.589 14.135l-.014-.006c-.008-.003-.016-.006-.023-.013a.11.11 0 01-.028-.093l.773-4.726 3.625 3.626-3.77 1.604a.083.083 0 01-.033.006h-.015c-.005-.003-.01-.007-.02-.017a1.716 1.716 0 00-.495-.381zm5.258-.288l3.876 3.876c.805.806 1.208 1.208 1.355 1.674.022.069.04.138.054.209l-9.263-3.923a.728.728 0 00-.015-.006c-.037-.015-.08-.032-.08-.07 0-.038.044-.056.081-.071l.012-.005 3.98-1.684zm5.127 7.003c-.2.376-.59.766-1.25 1.427l-4.37 4.369-5.652-1.177-.03-.007c-.042-.01-.095-.02-.095-.063 0-.043.052-.055.093-.066l.013-.004 7.025-2.988c.03-.012.061-.025.064-.06.002-.042-.04-.07-.076-.095a.18.18 0 00-.009-.007l-3.762-2.998-.006-.004c-.041-.033-.091-.074-.091-.12 0-.051.056-.077.101-.096l.015-.006 7.809 3.304.02.009zm-6.12 7.044l-8.384 8.384a2.36 2.36 0 01-.208.192l.694-4.236c.006-.036.01-.08.046-.103.03-.02.07-.01.103 0l.01.003 4.368.883c.036.007.08.015.107-.014.027-.03.021-.07.015-.105l-.004-.025-.888-4.392a.088.088 0 01.003-.063c.009-.018.024-.026.037-.033l.013-.007 2.04-.876c.038-.018.09-.04.128-.005.038.035.02.086.003.126l-.009.018-1.712 3.97c-.009.02-.018.043-.005.063a.07.07 0 00.054.027l.013.001 4.358.882c.036.007.076.015.1-.016.022-.028.018-.065.012-.098l-.003-.013-.36-1.754c-.006-.03-.013-.069.013-.095.026-.026.064-.02.094-.013l.013.003 3.327.672.03.007c.047.01.107.022.107.071 0 .048-.058.06-.1.07l-.009.002-3.676 1.555zm-8.384 8.384a2.378 2.378 0 01-1.044.567l-11.04-4.693a.1.1 0 00-.013-.005c-.04-.015-.088-.033-.088-.074 0-.04.048-.056.088-.07l.012-.005 12.085-5.15zm-14.7-3.196l-3.601-3.602 4.928-2.088c.032-.014.071-.03.1-.002.027.028.017.07.009.1l-.003.013-1.434 5.58zm-4.834-4.834L1.96 25.274l3.497-8.037c.01-.02.018-.043.04-.055.025-.015.055-.005.08.004l.013.005 3.467 1.46c.034.015.075.032.075.069 0 .036-.04.054-.075.069l-.018.008-3.089 1.32a.106.106 0 00-.045.028c-.02.024-.018.05-.014.076l.003.013.793 3.858zm-2.976-2.976l-2.61-2.61c-.444-.444-.766-.766-.996-1.04l7.771 3.273.014.006c.036.014.078.032.078.068 0 .034-.039.054-.074.071l-.016.008-4.167 1.76zm-4.156-4.545a2.387 2.387 0 01.36-1.742l7.075 2.986c.037.016.08.034.08.072s-.044.058-.082.073l-.013.005-7.42 3.15zM2.1 17.391l7.476-7.476 2.175 5.29c.01.027.023.062.003.088-.018.024-.052.03-.08.034l-.012.002-9.562 2.062zM10.8 8.69l6.202-6.202c.37-.37.699-.7.993-.965l-2.588 5.978c-.008.017-.015.038-.034.05-.02.013-.044.008-.066.003l-.013-.004L10.8 8.69zm8.104-7.873a2.38 2.38 0 011.694-.009l-3.344 1.42c-.038.016-.084.035-.115.003-.03-.031-.014-.077 0-.113l.003-.01 1.762-4.087zm4.55 1.017l8.22 8.22-2.17.923c-.038.015-.083.035-.115.003-.03-.03-.019-.074-.007-.11l.003-.013 1.665-3.868c.012-.03.028-.066.002-.094-.024-.025-.06-.018-.089-.012l-.013.003-3.404.687c-.038.008-.082.017-.11-.012-.03-.029-.02-.075-.01-.11l.004-.013.87-4.3c.007-.034.015-.076-.013-.103-.029-.027-.068-.018-.1-.009l-.013.004-1.788.756c-.04.017-.09.038-.123.005-.034-.035-.016-.085 0-.125l.007-.016 1.16-2.714z" />
          </svg>
          <span class="font-heading font-bold text-lg tracking-tight text-neutral-800 dark:text-neutral-50 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
            Netlify Cache Inspector
          </span>
        </NuxtLink>

        <ColorModeToggle />
      </div>
    </header>

    <main class="w-full max-w-6xl mx-auto px-6 py-10">
      <NuxtPage />
    </main>

    <footer class="footer-bar">
      <div class="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-sm">
        <nav class="flex items-center gap-5">
          <a
            href="https://www.netlify.com"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link"
          >Netlify</a>
          <a
            href="https://docs.netlify.com/platform/caching/"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link"
          >Caching docs</a>
        </nav>
        <span class="text-neutral-500 dark:text-neutral-400">
          Made by <a
            href="https://philippeserhal.com"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link"
          >Philippe Serhal</a>
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
  background: #F6F6F7;
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
  border-bottom: 1px solid #E9EBED;
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
  border-top: 1px solid #E9EBED;
  margin-top: auto;
}

:is(.dark) .footer-bar {
  border-top: 1px solid rgba(208, 255, 254, 0.08);
}

.footer-link {
  color: #05bdba;
  text-decoration: underline;
  text-decoration-color: rgba(5, 189, 186, 0.4);
  text-underline-offset: 2px;
  transition: all 0.15s ease;
}

.footer-link:hover {
  color: #04a29f;
  text-decoration-color: #04a29f;
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
