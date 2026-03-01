<script setup lang="ts">
import type { Run } from '~/types/run'

const props = defineProps<{
  runs: readonly Run[]
  error: string | null
  loading: boolean
  inputUrl: string
  onClear: () => void
}>()

const showUrl = computed(() => {
  if (props.runs.length === 0) return true
  return !props.runs.every((run) => run.url === props.inputUrl)
})
</script>

<template>
  <div class="mt-10">
    <div v-if="loading" data-testid="loading-indicator" class="loading-pulse">
      <span class="mono-label">Inspecting URL...</span>
    </div>

    <div v-if="error" data-testid="error" class="error-banner">
      {{ error }}
    </div>

    <div class="flex flex-wrap items-stretch gap-5 mt-6">
      <RunPanel
        v-for="(run, i) in runs"
        v-bind="run"
        :key="i"
        :enable-diff-on-hover="runs.length > 1"
        :show-url="showUrl"
        class="flex-1 min-w-80"
      />
    </div>

    <div v-if="runs.length > 0" class="text-center mt-10">
      <button class="btn-secondary" @click="onClear()">Clear runs</button>
    </div>
  </div>
</template>

<style scoped>
.loading-pulse {
  text-align: center;
  padding: 2rem;
  animation: pulse-opacity 2s ease-in-out infinite;
}

@keyframes pulse-opacity {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.error-banner {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: rgba(254, 78, 92, 0.08);
  border: 1px solid rgba(254, 78, 92, 0.2);
  color: #fe4e5c;
}
</style>
