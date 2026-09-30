import type { ApiReport, ApiReportWithRuns, ApiRun, Run } from '~/types/run'

const getRunFromApiRun = (apiRun: ApiRun): Run => {
  const { headers, ...run } = apiRun
  return { ...run, cacheHeaders: getCacheHeaders(headers) }
}

// State lives in useState so it survives the route changes syncRoute() makes as runs are added
export const useRunManager = () => {
  const runs = useState<Run[]>('runs', () => [])
  // ID of the persisted report holding exactly these runs; null with fewer than two runs
  const reportId = useState<string | null>('reportId', () => null)
  const error = useState<string | null>('runsError', () => null)
  const loading = useState<boolean>('runsLoading', () => false)

  const runIds = computed(() => runs.value.map((run) => run.runId))

  // Keep the URL a permalink for what's on screen. Reports are content-addressed and
  // immutable, so adding a run to a shared report yields a new URL rather than mutating it.
  const syncRoute = async (): Promise<void> => {
    if (runs.value.length === 0) {
      reportId.value = null
      await navigateTo('/')
      return
    }
    if (runs.value.length === 1) {
      reportId.value = null
      await navigateTo(`/run/${runIds.value[0]}`)
      return
    }
    const report = await $fetch<ApiReport>('/api/reports', {
      method: 'POST',
      body: { runIds: runIds.value },
    })
    reportId.value = report.reportId
    await navigateTo(`/report/${report.reportId}`)
  }

  const handleRequestFormSubmit = async ({ url }: { url: string }): Promise<void> => {
    loading.value = true
    try {
      const responseBody: ApiRun = await $fetch<ApiRun>('/api/inspect-url', {
        method: 'POST',
        body: { url },
      })

      runs.value.push(getRunFromApiRun(responseBody))
      error.value = null
    } catch (err: unknown) {
      error.value = getErrorMessage(err)
      return
    } finally {
      loading.value = false
    }

    try {
      await syncRoute()
    } catch (err: unknown) {
      error.value = `Could not create a report permalink: ${getErrorMessage(err)}`
    }
  }

  const handleClickClear = async (): Promise<void> => {
    runs.value = []
    error.value = null
    await syncRoute()
  }

  // Loaders return the run IDs (not the runs) so useAsyncData has a small, defined payload;
  // the runs themselves travel via useState. Both skip the fetch when the state already
  // matches, which is the case right after syncRoute() navigated here.
  const loadRun = async (runId: string): Promise<string[]> => {
    if (runs.value.length !== 1 || runIds.value[0] !== runId) {
      const apiRun = await $fetch<ApiRun>(`/api/runs/${runId}`)
      runs.value = [getRunFromApiRun(apiRun)]
      reportId.value = null
    }
    return runIds.value
  }

  const loadReport = async (id: string): Promise<string[]> => {
    if (reportId.value !== id) {
      const report = await $fetch<ApiReportWithRuns>(`/api/reports/${id}`)
      runs.value = report.runs.map(getRunFromApiRun)
      reportId.value = report.reportId
    }
    return runIds.value
  }

  const reset = (): void => {
    runs.value = []
    reportId.value = null
    error.value = null
  }

  const setError = (newError: string | null): void => {
    error.value = newError
  }

  return {
    // State
    runs: readonly(runs),
    reportId: readonly(reportId),
    error: readonly(error),
    loading: readonly(loading),

    // Methods
    handleRequestFormSubmit,
    handleClickClear,
    loadRun,
    loadReport,
    reset,
    setError,
    getRunFromApiRun,
  }
}
