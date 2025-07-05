<script setup lang="ts">
import type { Run } from '~/types/run'

defineProps<{
  runs: readonly Run[]
  error: string | null
  loading: boolean
  onClear: () => void
}>()

const showRawHeaders = ref(false)
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

    <div
      v-if="runs.length > 0"
      class="controls-container"
    >
      <label class="toggle-raw-headers-label">
        <input
          v-model="showRawHeaders"
          type="checkbox"
          class="toggle-raw-headers-checkbox"
        />
        <span class="toggle-raw-headers-text">Show raw headers</span>
      </label>
    </div>

    <div class="flex-btwn run-panels">
      <RunPanel
        v-for="(run, i) in runs"
        v-bind="run"
        :key="i"
        :enable-diff-on-hover="runs.length > 1"
        :show-raw-headers="showRawHeaders"
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
  margin-top: 1em;
}

.run-panels>* {
  flex: 1 1 20em;
}

.controls-container {
  display: flex;
  justify-content: center;
  padding: 1em 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1em;
}

.toggle-raw-headers-label {
  display: flex;
  align-items: center;
  gap: 0.5em;
  cursor: pointer;
  font-size: 0.9em;
  user-select: none;
}

.toggle-raw-headers-checkbox {
  width: 1.2em;
  height: 1.2em;
  cursor: pointer;
}

.toggle-raw-headers-text {
  color: #374151;
}

.reset-container {
  text-align: center;
  background-color: inherit;
}
</style>
