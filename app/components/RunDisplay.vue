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
      class="controls-bar"
    >
      <label class="toggle-control">
        <input
          v-model="showRawHeaders"
          type="checkbox"
          class="sr-only"
        />
        <span class="toggle-switch" />
        <span class="toggle-label">Show raw headers</span>
      </label>

      <button
        class="clear-button"
        @click="onClear()"
      >
        Clear
      </button>
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

.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.toggle-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
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
  width: 2.5rem;
  height: 1.5rem;
  background-color: #cbd5e1;
  border-radius: 0.75rem;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 1.25rem;
  height: 1.25rem;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

input:checked + .toggle-switch {
  background-color: #3b82f6;
}

input:checked + .toggle-switch::after {
  transform: translateX(1rem);
}

.toggle-control:hover .toggle-switch {
  background-color: #94a3b8;
}

input:checked + .toggle-switch:hover {
  background-color: #2563eb;
}

.toggle-label {
  font-weight: 500;
  color: #374151;
}

.clear-button {
  padding: 0.5rem 1rem;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.clear-button:hover {
  background-color: #dc2626;
  transform: translateY(-1px);
}

.clear-button:active {
  transform: translateY(0);
}
</style>
