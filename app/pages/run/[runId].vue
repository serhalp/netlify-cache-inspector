<script setup lang="ts">
import type { ApiRun } from '~/types/run'

const { runs, error, loading, handleRequestFormSubmit, handleClickClear, getRunFromApiRun, setRuns, setError } = useRunManager()

const route = useRoute()

const { data: initialRuns, pending: _pending, error: preloadedRunsError } = await useAsyncData('preloadedRuns', async () => {
  const { runId } = route.params
  if (typeof runId === 'string') {
    const response = await fetch(`/api/runs/${runId}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const responseBody: ApiRun = await response.json()
    return [getRunFromApiRun(responseBody)]
  }
  return []
})

if (preloadedRunsError.value) {
  setError(preloadedRunsError.value.toString())
}
if (initialRuns.value) {
  setRuns(initialRuns.value)
}
</script>

<template>
  <main>
    <RequestForm
      :loading="loading"
      @submit="handleRequestFormSubmit"
    />

    <RunDisplay
      :runs="runs"
      :error="error"
      :loading="loading"
      :on-clear="handleClickClear"
    />
  </main>
</template>

<style scoped>
</style>
