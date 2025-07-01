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

const toggleRawHeaders = () => {
  showRawHeaders.value = !showRawHeaders.value
}
</script>

<template>
  <div class="panel run-panel">
    <h3>{{ props.url }}</h3>

    <div class="flex-btwn">
      <small>HTTP {{ props.status }} ({{ props.durationInMs }} ms)</small>
      <div class="panel-actions">
        <button
          class="toggle-raw-headers"
          :title="showRawHeaders ? 'Hide raw headers' : 'Show raw headers'"
          @click="toggleRawHeaders"
        >
          {{ showRawHeaders ? 'Hide Raw Headers' : 'Show Raw Headers' }}
        </button>
        <NuxtLink
          :to="`/run/${props.runId}`"
          class="run-permalink"
          title="Share this run"
          target="_blank"
        >
          🔗 Permalink
        </NuxtLink>
      </div>
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

.panel-actions {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.toggle-raw-headers {
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.25em 0.5em;
  font-size: 0.7em;
  cursor: pointer;
  transition: background-color 0.2s;
}

.toggle-raw-headers:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.run-permalink {
  align-self: flex-end;
  font-size: 0.7em;
}
</style>
