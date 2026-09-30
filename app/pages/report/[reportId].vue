<script setup lang="ts">
const { runs, reportId, error, loading, handleRequestFormSubmit, handleClickClear, loadReport } =
  useRunManager()

const route = useRoute()
const requestedReportId = typeof route.params.reportId === 'string' ? route.params.reportId : ''

const { pending: initialLoading, error: preloadError } = await useAsyncData(
  `report-${requestedReportId}`,
  () => loadReport(requestedReportId),
)

const initialError = computed(() =>
  preloadError.value ? getErrorMessage(preloadError.value) : null,
)

// A missing permalink should be a real 404, not a 200 with an error banner
if (import.meta.server && preloadError.value) {
  const event = useRequestEvent()
  if (event) setResponseStatus(event, preloadError.value.statusCode ?? 500)
}

// Pre-fill with the last run's URL so re-running for comparison is one click away
const inputUrl = ref(runs.value.at(-1)?.url ?? '')
</script>

<template>
  <div>
    <RequestForm
      v-if="!initialLoading"
      v-model:input-url="inputUrl"
      :loading="loading"
      @submit="handleRequestFormSubmit"
    />

    <div v-else-if="initialLoading" class="py-6 text-center text-neutral-600 dark:text-neutral-300">
      Loading report...
    </div>

    <RunDisplay
      :runs="runs"
      :report-id="reportId"
      :error="initialError ?? error"
      :loading="loading"
      :input-url="inputUrl"
      :on-clear="handleClickClear"
    />
  </div>
</template>
