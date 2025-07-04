<script setup lang="ts">
const { runs, error, loading, handleRequestFormSubmit, handleClickClear, getRunFromApiRun, setRuns, setError } = useRunManager()

const route = useRoute()

const { data: initialRuns, pending: initialLoading, error: preloadedRunsError } = await useAsyncData('preloadedRuns', async () => {
  const { runId } = route.params
  if (typeof runId === 'string') {
    const responseBody = await $fetch(`/api/runs/${runId}`)
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

// Get the URL from the loaded run - we know it exists since we successfully loaded the run
const runUrl = computed(() => {
  const loadedRun = runs.value[0] || initialRuns.value?.[0]
  return loadedRun?.url
})
</script>

<template>
  <main>
    <!-- Only render RequestForm when we have loaded the initial run -->
    <RequestForm
      v-if="!initialLoading && runUrl"
      :loading="loading"
      :initial-url="runUrl"
      @submit="handleRequestFormSubmit"
    />

    <!-- Show loading state while initial run is loading -->
    <div
      v-else-if="initialLoading"
      class="loading-state"
    >
      Loading run...
    </div>

    <RunDisplay
      :runs="runs"
      :error="error"
      :loading="loading"
      :on-clear="handleClickClear"
    />
  </main>
</template>

<style scoped>
.loading-state {
  padding: 1em;
  text-align: center;
  color: #666;
}
</style>
