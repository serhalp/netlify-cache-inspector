<script setup lang="ts">
const props = defineProps<{
  url: string;
  status: number;
  durationInMs: number;
  cacheHeaders: Record<string, string>;
}>();
</script>

<template>
  <div class="panel run-panel">
    <h3>{{ props.url }}</h3>

    <small>HTTP {{ props.status }} ({{ props.durationInMs }} ms)</small>

    <CacheAnalysis :cacheHeaders="props.cacheHeaders" />
    <RawCacheHeaders :cacheHeaders="props.cacheHeaders" />
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
</style>
