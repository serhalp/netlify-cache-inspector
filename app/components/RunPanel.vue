<script setup lang="ts">
const props = defineProps<{
  runId: string
  url: string
  status: number
  durationInMs: number
  cacheHeaders: Record<string, string>
  enableDiffOnHover: boolean
  showUrl: boolean
}>()

const showRawHeaders = ref(false)
</script>

<template>
  <div class="run-card">
    <div
      v-if="props.showUrl"
      class="flex items-baseline justify-between gap-3 mb-3"
    >
      <h3 class="font-mono text-sm font-500 text-neutral-800 dark:text-neutral-100 break-all leading-relaxed">
        {{ props.url }}
      </h3>
      <NuxtLink
        :to="`/run/${props.runId}`"
        class="permalink-link"
        title="Share this run"
        target="_blank"
      >
        <span class="permalink-text">Permalink</span>
        <svg
          class="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
      </NuxtLink>
    </div>

    <div class="flex items-center justify-between mb-4">
      <span class="mono-label">
        <span :class="props.status >= 400 ? 'text-red-500' : ''">HTTP {{ props.status }}</span> &middot; {{ props.durationInMs }}<span class="normal-case">ms</span>
        <template v-if="!props.showUrl">
          &middot;
          <NuxtLink
            :to="`/run/${props.runId}`"
            class="permalink-link"
            title="Share this run"
            target="_blank"
          >
            <span class="permalink-text">Permalink</span>
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          </NuxtLink>
        </template>
      </span>

      <label class="toggle-label ml-auto">
        <input
          v-model="showRawHeaders"
          type="checkbox"
          class="sr-only peer"
          :aria-label="'Show raw headers for ' + props.url"
        />
        <span class="mono-label cursor-pointer toggle-text-full">Show raw headers</span>
        <span class="mono-label cursor-pointer toggle-text-short">Raw</span>
        <span class="toggle-track" />
      </label>
    </div>

    <CacheAnalysis
      :cache-headers="props.cacheHeaders"
      :enable-diff-on-hover="props.enableDiffOnHover"
    />
    <div v-if="showRawHeaders">
      <hr class="raw-separator" />
      <h4 class="mono-label mb-2">
        Raw cache headers
      </h4>
      <RawCacheHeaders :cache-headers="props.cacheHeaders" />
    </div>
  </div>
</template>

<style scoped>
.run-card {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid #E9EBED;
  background: white;
  transition: border-color 0.15s cubic-bezier(0.33, 1, 0.68, 1);
}

.toggle-text-short {
  display: none;
}

@container (max-width: 400px) {
  .toggle-text-full {
    display: none;
  }
  .toggle-text-short {
    display: inline;
  }
}

.run-card:hover {
  border-color: #D1D5DA;
}

:is(.dark) .run-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(208, 255, 254, 0.1);
}

:is(.dark) .run-card:hover {
  border-color: rgba(208, 255, 254, 0.2);
}

.permalink-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  color: #778089;
  font-size: 0.75rem;
  text-decoration: none;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

:is(.dark) .permalink-link {
  color: #9DA7B2;
}

.permalink-link:hover {
  color: #05bdba;
  background: rgba(5, 189, 186, 0.08);
}

.permalink-text {
  font-family: 'Roboto Mono', monospace;
  font-weight: 500;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.toggle-track {
  position: relative;
  display: inline-block;
  width: 1.75rem;
  height: 1rem;
  background-color: #D1D5DA;
  border-radius: 0.5rem;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

:is(.dark) .toggle-track {
  background-color: rgba(255, 255, 255, 0.1);
}

.toggle-track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 0.75rem;
  height: 0.75rem;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s cubic-bezier(0.33, 1, 0.68, 1);
}

.peer:checked ~ .toggle-track {
  background-color: #05bdba;
}

.peer:checked ~ .toggle-track::after {
  transform: translateX(0.75rem);
}

.toggle-label:hover .toggle-track {
  background-color: #9DA7B2;
}

:is(.dark) .toggle-label:hover .toggle-track {
  background-color: rgba(255, 255, 255, 0.15);
}

.toggle-label:hover .peer:checked ~ .toggle-track {
  background-color: #04a29f;
}

.raw-separator {
  border: none;
  height: 1px;
  background: #E9EBED;
  margin: 1rem 0;
}

:is(.dark) .raw-separator {
  background: rgba(208, 255, 254, 0.08);
}
</style>
