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
        title="Share this run (opens in new tab)"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span aria-hidden="true">🔗</span> Permalink<span class="sr-only"> (opens in new tab)</span>
      </NuxtLink>
    </div>

    <div class="toggle-container">
      <label
        for="show-raw-headers"
        class="toggle-control"
      >
        <input
          id="show-raw-headers"
          v-model="showRawHeaders"
          type="checkbox"
          class="sr-only"
          :aria-label="'Show raw headers for ' + props.url"
        />
        <span class="toggle-switch" />
        <span class="toggle-label">Show raw headers</span>
      </label>
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
  font-size: 0.7em;
}

.toggle-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
}

.toggle-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  font-size: 0.7em;
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

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 2rem;
  height: 1.125rem;
  background-color: #cbd5e1;
  border-radius: 0.5625rem;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 0.875rem;
  height: 0.875rem;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

input:checked + .toggle-switch {
  background-color: #3b82f6;
}

input:checked + .toggle-switch::after {
  transform: translateX(0.875rem);
}

.toggle-control:hover .toggle-switch {
  background-color: #94a3b8;
}

.toggle-control:hover input:checked + .toggle-switch {
  background-color: #2563eb;
}

.toggle-label {
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}
</style>
