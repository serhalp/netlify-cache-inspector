<script setup lang="ts">
import type { Run } from '~/types/run'

defineProps<{
  runs: readonly Run[]
  error: string | null
  loading: boolean
  onClear: () => void
  currentReportId?: string | null
}>()

const generateReportPermalink = (reportId: string) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return `${baseUrl}/report/${reportId}`
}

const copyToClipboard = async (text: string) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)
    }
    catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }
}
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
      <div
        v-if="currentReportId && runs.length > 0"
        class="report-permalink"
      >
        <label>Share this report:</label>
        <div class="permalink-container">
          <input
            :value="generateReportPermalink(currentReportId)"
            readonly
            class="permalink-input"
          />
          <button
            class="copy-button"
            title="Copy to clipboard"
            @click="copyToClipboard(generateReportPermalink(currentReportId))"
          >
            📋
          </button>
        </div>
      </div>

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

.report-permalink {
  margin-bottom: 1em;
  padding: 1em;
  background-color: var(--bg-200, #f8fafc);
  border-radius: 0.5em;
  border: 1px solid var(--border-200, #e2e8f0);
}

.report-permalink label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5em;
  color: var(--text-700, #374151);
}

.permalink-container {
  display: flex;
  gap: 0.5em;
  align-items: stretch;
  max-width: 100%;
  margin: 0 auto;
}

.permalink-input {
  flex: 1;
  padding: 0.5em;
  border: 1px solid var(--border-300, #d1d5db);
  border-radius: 0.25em;
  background-color: white;
  font-family: monospace;
  font-size: 0.875em;
}

.copy-button {
  padding: 0.5em 1em;
  background-color: white;
  color: var(--blue-600, #2563eb);
  border: 2px solid var(--blue-600, #2563eb);
  border-radius: 0.25em;
  cursor: pointer;
  font-size: 0.875em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.copy-button:hover {
  background-color: var(--blue-50, #eff6ff);
}
</style>
