<script setup lang="ts">
const { runs, error, loading, handleRequestFormSubmit, handleClickClear, getRunFromApiRun, setRuns, setError } = useRunManager()

const route = useRoute()

const { data: initialRuns, pending: _pending, error: preloadedRunsError } = await useAsyncData('preloadedRuns', async () => {
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
