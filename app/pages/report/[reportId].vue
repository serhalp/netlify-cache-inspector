<script setup lang="ts">
import type { ApiRun } from '~/types/run'

const { runs, error, loading, handleRequestFormSubmit, handleClickClear, getRunFromApiRun, setRuns, setError, currentReportId, setCurrentReportId } = useRunManager()

const route = useRoute()

const { data: reportData, pending: _pending, error: preloadedReportError } = await useAsyncData('preloadedReport', async () => {
  const { reportId } = route.params
  if (typeof reportId === 'string') {
    const responseBody = await $fetch(`/api/reports/${reportId}`)
    return responseBody
  }
  return null
})

if (preloadedReportError.value) {
  setError(preloadedReportError.value.toString())
}
else if (reportData.value) {
  // Set current report ID so new runs get added to this report
  setCurrentReportId(reportData.value.reportId)
  // Convert API runs to frontend runs
  const frontendRuns = reportData.value.runs.map((apiRun: ApiRun) => getRunFromApiRun(apiRun))
  setRuns(frontendRuns)
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
      :current-report-id="currentReportId"
    />
  </main>
</template>

<style scoped>
</style>
