import type { ApiReport, ApiReportWithRuns, ApiRun, Run } from '~/types/run'

const getRunFromApiRun = (apiRun: ApiRun): Run => {
  const { headers, ...run } = apiRun
  return { ...run, cacheHeaders: getCacheHeaders(headers) }
}

const sameIds = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id, i) => id === b[i])

// State lives in useState so it survives the route changes syncRoute() makes as runs are added
export const useRunManager = () => {
  const runs = useState<Run[]>('runs', () => [])
  // ID of the persisted report holding exactly these runs; null with fewer than two runs
  const reportId = useState<string | null>('reportId', () => null)
  const error = useState<string | null>('runsError', () => null)
  const loading = useState<boolean>('runsLoading', () => false)
  // Bumped whenever the run set is replaced wholesale, so in-flight requests started against an
  // earlier set (the user navigated away meanwhile) can tell their result is stale and drop it.
  const version = useState<number>('runsVersion', () => 0)

  const runIds = computed(() => runs.value.map((run) => run.runId))

  const replaceRuns = (newRuns: Run[], newReportId: string | null): void => {
    runs.value = newRuns
    reportId.value = newReportId
    error.value = null
    version.value++
  }

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
    const postedRunIds = runIds.value
    const report = await $fetch<ApiReport>('/api/reports', {
      method: 'POST',
      body: { runIds: postedRunIds },
    })
    // The user moved on while the report was being saved; that report is no longer theirs
    if (!sameIds(runIds.value, postedRunIds)) return
    reportId.value = report.reportId
    await navigateTo(`/report/${report.reportId}`)
  }

  const handleRequestFormSubmit = async ({ url }: { url: string }): Promise<void> => {
    const startedAtVersion = version.value
    loading.value = true
    try {
      const responseBody: ApiRun = await $fetch<ApiRun>('/api/inspect-url', {
        method: 'POST',
        body: { url },
      })
      if (version.value !== startedAtVersion) return

      runs.value.push(getRunFromApiRun(responseBody))
      error.value = null
    } catch (err: unknown) {
      if (version.value === startedAtVersion) error.value = getErrorMessage(err)
      return
    } finally {
      loading.value = false
    }

    // Hold the form until the URL matches the screen, so a second submit can't interleave
    loading.value = true
    try {
      await syncRoute()
    } catch (err: unknown) {
      // Whatever report the URL still names no longer matches the screen, so offer no link to it
      reportId.value = null
      error.value = `Could not create a report permalink: ${getErrorMessage(err)}`
    } finally {
      loading.value = false
    }
  }

  const handleClickClear = async (): Promise<void> => {
    replaceRuns([], null)
    await syncRoute()
  }

  // Loaders return the run IDs (not the runs) so useAsyncData has a small, defined payload;
  // the runs themselves travel via useState. Both skip the fetch when the state already
  // matches, which is the case right after syncRoute() navigated here. A result arriving after
  // the page was left (signal aborted) is dropped so it can't clobber the next page's state.
  const loadRun = async (runId: string, signal?: AbortSignal): Promise<string[]> => {
    if (runs.value.length !== 1 || runIds.value[0] !== runId) {
      const apiRun = await $fetch<ApiRun>(`/api/runs/${encodeURIComponent(runId)}`)
      if (signal?.aborted) return runIds.value
      replaceRuns([getRunFromApiRun(apiRun)], null)
    }
    return runIds.value
  }

  const loadReport = async (id: string, signal?: AbortSignal): Promise<string[]> => {
    if (reportId.value !== id || runs.value.length === 0) {
      const report = await $fetch<ApiReportWithRuns>(`/api/reports/${encodeURIComponent(id)}`)
      if (signal?.aborted) return runIds.value
      replaceRuns(report.runs.map(getRunFromApiRun), report.reportId)
    }
    return runIds.value
  }

  const reset = (): void => {
    replaceRuns([], null)
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
