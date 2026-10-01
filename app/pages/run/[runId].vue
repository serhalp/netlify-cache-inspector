<script setup lang="ts">
// Adding a run navigates to a new permalink; don't yank the user back to the top each time
definePageMeta({ scrollToTop: false })

const { runs, reportId, error, loading, handleRequestFormSubmit, handleClickClear, loadRun } =
  useRunManager()

const route = useRoute()
const runId = typeof route.params.runId === 'string' ? route.params.runId : ''

const { pending: initialLoading, error: preloadError } = await useAsyncData(
  `run-${runId}`,
  (_, options) => loadRun(runId, options?.signal),
)

const initialError = computed(() =>
  preloadError.value ? getErrorMessage(preloadError.value) : null,
)

// A missing permalink should be a real 404, not a 200 with an error banner
if (import.meta.server && preloadError.value) {
  const event = useRequestEvent()
  if (event) setResponseStatus(event, preloadError.value.statusCode ?? 500)
}

const inputUrl = ref(runs.value[0]?.url ?? '')
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
    <div v-else-if="initialLoading" class="py-6 text-center text-neutral-600 dark:text-neutral-300">
      Loading run...
    </div>

    <RunDisplay
      :runs="runs"
      :report-id="reportId"
      :error="error ?? initialError"
      :loading="loading"
      :input-url="inputUrl"
      :on-clear="handleClickClear"
    />
  </div>
</template>
