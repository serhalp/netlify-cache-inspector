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

const inputUrl = ref(initialRuns.value?.[0]?.url ?? '')
</script>

<template>
  <div>
    <!-- Only render RequestForm when we have loaded the initial run -->
    <RequestForm
      v-if="!initialLoading"
      v-model:input-url="inputUrl"
      :loading="loading"
      @submit="handleRequestFormSubmit"
    />

    <!-- Show loading state while initial run is loading -->
    <div
      v-else-if="initialLoading"
      class="py-6 text-center text-neutral-600 dark:text-neutral-300"
    >
      Loading run...
    </div>

    <RunDisplay
      :runs="runs"
      :error="error"
      :loading="loading"
      :input-url="inputUrl"
      :on-clear="handleClickClear"
    />
  </div>
</template>
