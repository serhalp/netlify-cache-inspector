import type { Run, ApiRun } from '~/types/run'

export const useRunManager = () => {
  const runs = ref<Run[]>([])
  const error = ref<string | null>(null)
  const loading = ref<boolean>(false)

  // oxlint-disable-next-line unicorn/consistent-function-scoping -- intentionally scoped inside composable
  const getRunFromApiRun = (apiRun: ApiRun): Run => {
    const { headers, ...run } = apiRun
    return { ...run, cacheHeaders: getCacheHeaders(headers) }
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
      const e = err as Record<string, unknown> | undefined
      error.value =
        ((e?.data as Record<string, unknown>)?.message as string) ??
        (typeof e?.toString === 'function' ? e.toString() : null) ??
        new Error(`Fetch error: ${err}`)
      return
    } finally {
      loading.value = false
    }
  }

  const handleClickClear = (): void => {
    runs.value = []
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

  return {
    // State
    runs: readonly(runs),
    error: readonly(error),
    loading: readonly(loading),

    // Methods
    handleRequestFormSubmit,
    handleClickClear,
    addRun,
    setRuns,
    setError,
    getRunFromApiRun,
  }
}
