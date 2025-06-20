<script setup lang="ts">
const props = defineProps<{
  runId: string
  url: string
  status: number
  durationInMs: number
  cacheHeaders: Record<string, string>
  enableDiffOnHover: boolean
}>()
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

    <CacheAnalysis
      :cache-headers="props.cacheHeaders"
      :enable-diff-on-hover="props.enableDiffOnHover"
    />
    <RawCacheHeaders :cache-headers="props.cacheHeaders" />
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
</style>
