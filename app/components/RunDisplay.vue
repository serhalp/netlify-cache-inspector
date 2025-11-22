<script setup lang="ts">
import type { Run } from '~/types/run'

defineProps<{
  runs: readonly Run[]
  error: string | null
  loading: boolean
  onClear: () => void
}>()
</script>

<template>
  <div>
    <div
      v-if="loading"
      class="loading-indicator"
    >
      ⏳ Inspecting URL...
    </div>

    <div
      v-if="error"
      class="error"
    >
      {{ error }}
    </div>

    <div class="flex-btwn run-panels">
      <RunPanel
        v-for="(run, i) in runs"
        v-bind="run"
        :key="i"
        :enable-diff-on-hover="runs.length > 1"
      />
    </div>

    <div class="reset-container">
      <button
        v-if="runs.length > 0"
        @click="onClear()"
      >
        Clear
      </button>
    </div>
  </div>
</template>

<style scoped>
.loading-indicator {
  text-align: center;
  padding: 1em;
  color: var(--blue-600, #2563eb);
  font-weight: 500;
}

.error {
  color: var(--red-400);
}

.run-panels {
  flex-wrap: wrap;
  align-items: stretch;
}

.run-panels>* {
  flex: 1 1 20em;
}

.reset-container {
  text-align: center;
  background-color: inherit;
}
</style>
