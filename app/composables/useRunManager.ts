import type { Run, ApiRun } from '~/types/run'

export const useRunManager = () => {
  const runs = ref<Run[]>([])
  const error = ref<string | null>(null)
  const loading = ref<boolean>(false)
  const currentReportId = ref<string | null>(null)

  const getRunFromApiRun = (apiRun: ApiRun): Run => {
    const { headers, reportId, ...run } = apiRun
    return { ...run, cacheHeaders: getCacheHeaders(headers) }
  }

  const handleRequestFormSubmit = async ({
    url,
  }: {
    url: string
  }): Promise<void> => {
    loading.value = true
    try {
      const responseBody: ApiRun = await $fetch<ApiRun>('/api/inspect-url', {
        method: 'POST',
        body: {
          url,
          currentReportId: currentReportId.value,
        },
      })

      runs.value.push(getRunFromApiRun(responseBody))

      // Update current report ID with the new one returned from the API
      if (responseBody.reportId) {
        currentReportId.value = responseBody.reportId
      }

      error.value = null
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (err: any) {
      error.value
        = err?.data?.message
          ?? err?.toString?.()
          ?? new Error(`Fetch error: ${err}`)
      return
    }
    finally {
      loading.value = false
    }
  }

  const handleClickClear = (): void => {
    runs.value = []
    currentReportId.value = null
  }

  const addRun = (run: Run): void => {
    runs.value.push(run)
  }

  const setRuns = (newRuns: Run[]): void => {
    runs.value = newRuns
  }

  const setError = (newError: string | null): void => {
    error.value = newError
  }

  const setCurrentReportId = (reportId: string | null): void => {
    currentReportId.value = reportId
  }

  return {
    // State
    runs: readonly(runs),
    error: readonly(error),
    loading: readonly(loading),
    currentReportId: readonly(currentReportId),

    // Methods
    handleRequestFormSubmit,
    handleClickClear,
    addRun,
    setRuns,
    setError,
    setCurrentReportId,
    getRunFromApiRun,
  }
}
