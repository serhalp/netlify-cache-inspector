<script setup lang="ts">
const { runs, error, loading, handleRequestFormSubmit, handleClickClear } = useRunManager()
const inputUrl = ref('https://nextjs-netlify-durable-cache-demo.netlify.app/isr-page')

const showHero = computed(() => runs.value.length === 0 && !loading.value)
</script>

<template>
  <div>
    <Transition name="hero">
      <section
        v-if="showHero"
        class="hero"
      >
        <h1 class="font-heading font-bold text-3xl sm:text-4xl tracking-tight text-neutral-800 dark:text-neutral-50 mb-3">
          Understand how Netlify<br />caches your site
        </h1>
        <p class="text-xl text-neutral-600 dark:text-neutral-400 max-w-xl mb-8 leading-relaxed">
          Paste a URL, inspect the response cache headers, and see exactly what each CDN layer did. Hits, misses, TTLs, the whole picture.
        </p>

        <div class="features">
          <div class="feature">
            <div
              class="feature-icon"
              aria-hidden="true"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p class="font-body font-700 text-lg text-neutral-700 dark:text-neutral-200 mb-0.5">
              Deep inspection
            </p>
            <p class="text-base text-neutral-500 dark:text-neutral-400 leading-snug">
              Fetches with Netlify debug headers to reveal the full cache lifecycle
            </p>
          </div>
          <div class="feature">
            <div
              class="feature-icon"
              aria-hidden="true"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M9 5l7 7-7 7" />
                <path d="M15 5l7 7-7 7" />
              </svg>
            </div>
            <p class="font-body font-700 text-lg text-neutral-700 dark:text-neutral-200 mb-0.5">
              Side-by-side comparison
            </p>
            <p class="text-base text-neutral-500 dark:text-neutral-400 leading-snug">
              Run multiple inspections and hover to compare field by field
            </p>
          </div>
          <div class="feature">
            <div
              class="feature-icon"
              aria-hidden="true"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <p class="font-body font-700 text-lg text-neutral-700 dark:text-neutral-200 mb-0.5">
              Shareable permalinks
            </p>
            <p class="text-base text-neutral-500 dark:text-neutral-400 leading-snug">
              Every run gets a unique link you can send to teammates
            </p>
          </div>
        </div>
      </section>
    </Transition>

    <RequestForm
      v-model:input-url="inputUrl"
      :loading="loading"
      @submit="handleRequestFormSubmit"
    />

    <RunDisplay
      :runs="runs"
      :error="error"
      :loading="loading"
      :input-url="inputUrl"
      :on-clear="handleClickClear"
    />
  </div>
</template>

<style scoped>
.hero {
  text-align: center;
  margin-bottom: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.features {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  width: 100%;
  max-width: 32rem;
}

@media (min-width: 640px) {
  .features {
    grid-template-columns: repeat(3, 1fr);
    max-width: none;
  }
}

.feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
  padding: 1.25rem 1rem;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

:is(.dark) .feature {
  background: rgba(208, 255, 254, 0.03);
  border-color: rgba(208, 255, 254, 0.06);
}

.feature-icon {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(5, 189, 186, 0.08);
  color: #04a29f;
}

:is(.dark) .feature-icon {
  background: rgba(5, 189, 186, 0.12);
  color: #32e6e2;
}

.hero-enter-active {
  transition: all 0.3s cubic-bezier(0.33, 1, 0.68, 1);
}

.hero-leave-active {
  transition: all 0.2s ease-in;
}

.hero-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.hero-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
