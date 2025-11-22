<script setup lang="ts">
const props = defineProps<{
  runId: string
  url: string
  status: number
  durationInMs: number
  cacheHeaders: Record<string, string>
  enableDiffOnHover: boolean
}>()

const showRawHeaders = ref(false)
</script>

<template>
  <div class="panel run-panel">
    <h3>{{ props.url }}</h3>

    <div class="flex-btwn">
      <small>HTTP {{ props.status }} ({{ props.durationInMs }} ms)</small>
      <NuxtLink
        :to="`/run/${props.runId}`"
        class="run-permalink"
        title="Share this run"
        target="_blank"
      >
        🔗 Permalink
      </NuxtLink>
    </div>

    <div class="toggle-container">
      <button
        class="toggle-button"
        :aria-expanded="showRawHeaders"
        :title="showRawHeaders ? 'Hide raw headers' : 'Show raw headers'"
        @click="showRawHeaders = !showRawHeaders"
      >
        {{ showRawHeaders ? 'Hide' : 'Show' }} raw headers
      </button>
    </div>

    <CacheAnalysis
      :cache-headers="props.cacheHeaders"
      :enable-diff-on-hover="props.enableDiffOnHover"
    />
    <RawCacheHeaders
      v-if="showRawHeaders"
      :cache-headers="props.cacheHeaders"
    />
  </div>
</template>

<style scoped>
.run-panel {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-content: center;

  margin: 1em;
}

.run-panel h3 {
  font-size: 1em;
  align-self: start;
}

.run-permalink {
  align-self: flex-end;
  font-size: 0.7em;
}

.toggle-container {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.toggle-button {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #3b82f6;
  background-color: transparent;
  border: 1px solid #3b82f6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-button:hover {
  background-color: #3b82f6;
  color: white;
}

.toggle-button:active {
  transform: scale(0.98);
}
</style>
