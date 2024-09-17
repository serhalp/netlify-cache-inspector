<script setup lang="ts">
const props = defineProps<{
  url: string;
  status: number;
  durationInMs: number;
  cacheHeaders: Record<string, string>;
}>();
</script>

<template>
  <div>
    <h3>{{ props.url }}</h3>

    <small>HTTP {{ props.status }} ({{ props.durationInMs }} ms)</small>

    <RawCacheHeaders :cacheHeaders="props.cacheHeaders" />
  </div>
</template>

<style scoped>
h3 {
  font-size: 1em;
}
</style>
