import { MAX_RUNS_PER_REPORT } from '#shared/reports'
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
  // Bumped whenever the run set is replaced or a permalink is loaded, so in-flight requests
  // started against an earlier page can tell their result is stale and drop it.
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
    const startedAtVersion = version.value
    const report = await $fetch<ApiReport>('/api/reports', {
      method: 'POST',
      body: { runIds: postedRunIds },
    })
    // The user moved on while the report was being saved; that report is no longer theirs
    if (version.value !== startedAtVersion || !sameIds(runIds.value, postedRunIds)) return
    reportId.value = report.reportId
    await navigateTo(`/report/${report.reportId}`)
  }

  const handleRequestFormSubmit = async ({ url }: { url: string }): Promise<void> => {
    // Stop before inspecting: a run we cannot turn into a link would silently drop off on reload
    if (runs.value.length >= MAX_RUNS_PER_REPORT) {
      error.value = `A report can contain at most ${MAX_RUNS_PER_REPORT} runs. Clear the runs to start over.`
      return
    }

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

      try {
        await syncRoute()
      } catch (err: unknown) {
        // Whatever report the URL still names no longer matches the screen, so offer no link to it
        reportId.value = null
        error.value = `Could not create a report permalink: ${getErrorMessage(err)}`
      }
    } catch (err: unknown) {
      if (version.value === startedAtVersion) error.value = getErrorMessage(err)
    } finally {
      loading.value = false
    }
  }

  const handleClickClear = async (): Promise<void> => {
    replaceRuns([], null)
    await syncRoute()
  }

  // Every load bumps version first, retiring in-flight submits and earlier loads. Matching state
  // skips the fetch, and a failed load clears the runs so the old page's set can't linger here.
  const loadRun = async (runId: string): Promise<void> => {
    const startedAtVersion = ++version.value
    if (runs.value.length === 1 && runIds.value[0] === runId) return
    try {
      const apiRun = await $fetch<ApiRun>(`/api/runs/${encodeURIComponent(runId)}`)
      if (version.value === startedAtVersion) replaceRuns([getRunFromApiRun(apiRun)], null)
    } catch (err) {
      if (version.value === startedAtVersion) replaceRuns([], null)
      throw err
    }
  }

  const loadReport = async (id: string): Promise<void> => {
    const startedAtVersion = ++version.value
    if (reportId.value === id && runs.value.length > 0) return
    try {
      const report = await $fetch<ApiReportWithRuns>(`/api/reports/${encodeURIComponent(id)}`)
      if (version.value === startedAtVersion) {
        replaceRuns(report.runs.map(getRunFromApiRun), report.reportId)
      }
    } catch (err) {
      if (version.value === startedAtVersion) replaceRuns([], null)
      throw err
    }
  }

  const reset = (): void => {
    replaceRuns([], null)
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
  }
}
