/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { MAX_RUNS_PER_REPORT } from '#shared/reports'
import { $fetch } from '#build/fetch'
import { useRunManager } from './useRunManager'
import type { ApiRun, ApiReportWithRuns } from '~/types/run'

// Mock the getCacheHeaders function
vi.mock('~/utils/getCacheHeaders', () => ({
  default: vi.fn((headers: Record<string, string>) => headers),
}))

vi.mock('~/utils/getErrorMessage', () => ({
  default: vi.fn((err: unknown) => String(err)),
}))

// Nuxt's $fetch is bound to `globalThis.$fetch` at module load, so mock the module itself
vi.mock('#build/fetch', () => ({
  $fetch: vi.fn(),
}))

// Plain refs stand in for Nuxt's shared state: each useRunManager() call gets fresh state here
mockNuxtImport('useState', async () => {
  const { ref } = await import('vue')
  return (_key: string, init: () => unknown) => ref(init())
})

const { navigateTo } = vi.hoisted(() => ({ navigateTo: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateTo)

global.fetch = vi.fn()

const mockFetch = vi.mocked($fetch)

const apiRun = (runId: string): ApiRun => ({
  runId,
  url: 'https://example.com',
  status: 200,
  durationInMs: 100,
  headers: { 'cache-control': 'max-age=3600' },
})

const resolveFetchOnce = (value: unknown) => mockFetch.mockResolvedValueOnce(value)

const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

// Lets a test hold a $fetch call open while it changes state around it
const deferFetchOnce = <T>() => {
  const d = deferred<T>()
  mockFetch.mockReturnValueOnce(d.promise)
  return d
}

describe('useRunManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const { runs, reportId, error, loading } = useRunManager()

    expect(runs.value).toEqual([])
    expect(reportId.value).toBe(null)
    expect(error.value).toBe(null)
    expect(loading.value).toBe(false)
  })

  it('navigates to the run permalink after the first inspection', async () => {
    resolveFetchOnce(apiRun('run-1'))

    const { runs, reportId, error, loading, handleRequestFormSubmit } = useRunManager()

    await handleRequestFormSubmit({ url: 'https://example.com' })

    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
    expect(runs.value).toHaveLength(1)
    expect(runs.value[0]?.url).toBe('https://example.com')
    expect(reportId.value).toBe(null)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/inspect-url', {
      method: 'POST',
      body: { url: 'https://example.com' },
    })
    expect(navigateTo).toHaveBeenCalledWith('/run/run-1')
  })

  it('persists a report and navigates to it once there are two runs', async () => {
    resolveFetchOnce(apiRun('run-1'))
    resolveFetchOnce(apiRun('run-2'))
    resolveFetchOnce({ reportId: 'report-1', runIds: ['run-1', 'run-2'] })

    const { runs, reportId, handleRequestFormSubmit } = useRunManager()

    await handleRequestFormSubmit({ url: 'https://example.com' })
    await handleRequestFormSubmit({ url: 'https://example.com' })

    expect(runs.value).toHaveLength(2)
    expect(reportId.value).toBe('report-1')
    expect(mockFetch).toHaveBeenCalledWith('/api/reports', {
      method: 'POST',
      body: { runIds: ['run-1', 'run-2'] },
    })
    expect(navigateTo).toHaveBeenLastCalledWith('/report/report-1')
  })

  it('keeps the runs but reports an error when the report cannot be persisted', async () => {
    resolveFetchOnce(apiRun('run-1'))
    resolveFetchOnce(apiRun('run-2'))
    mockFetch.mockRejectedValueOnce(new Error('HTTP 500'))

    const { runs, reportId, error, loading, handleRequestFormSubmit } = useRunManager()

    await handleRequestFormSubmit({ url: 'https://example.com' })
    await handleRequestFormSubmit({ url: 'https://example.com' })

    expect(runs.value).toHaveLength(2)
    expect(reportId.value).toBe(null)
    expect(loading.value).toBe(false)
    expect(error.value).toContain('Could not create a report permalink')
    expect(navigateTo).toHaveBeenCalledTimes(1)
  })

  it('drops the previous report link when adding to an existing report fails', async () => {
    resolveFetchOnce({
      reportId: 'report-1',
      runIds: ['run-1', 'run-2'],
      runs: [apiRun('run-1'), apiRun('run-2')],
    })
    resolveFetchOnce(apiRun('run-3'))
    mockFetch.mockRejectedValueOnce(new Error('HTTP 400'))

    const { runs, reportId, error, loadReport, handleRequestFormSubmit } = useRunManager()

    await loadReport('report-1')
    await handleRequestFormSubmit({ url: 'https://example.com' })

    expect(runs.value).toHaveLength(3)
    // report-1 only has two runs, so offering its link would mislead
    expect(reportId.value).toBe(null)
    expect(error.value).toContain('Could not create a report permalink')
  })

  it('keeps loading until navigation has completed', async () => {
    resolveFetchOnce(apiRun('run-1'))
    const navigation = deferred<void>()
    navigateTo.mockReturnValueOnce(navigation.promise)

    const { loading, handleRequestFormSubmit } = useRunManager()

    const submit = handleRequestFormSubmit({ url: 'https://example.com' })
    await vi.waitFor(() => expect(navigateTo).toHaveBeenCalled())
    expect(loading.value).toBe(true)

    navigation.resolve()
    await submit
    expect(loading.value).toBe(false)
  })

  it('discards an inspection that completes after the runs were replaced', async () => {
    const inspect = deferFetchOnce<ApiRun>()

    const { runs, error, loading, handleRequestFormSubmit, reset } = useRunManager()

    const submit = handleRequestFormSubmit({ url: 'https://example.com' })
    reset()
    inspect.resolve(apiRun('run-1'))
    await submit

    expect(runs.value).toEqual([])
    expect(error.value).toBe(null)
    expect(loading.value).toBe(false)
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('does not navigate to a report saved for runs that are no longer on screen', async () => {
    resolveFetchOnce(apiRun('run-1'))
    resolveFetchOnce(apiRun('run-2'))
    const save = deferFetchOnce<{ reportId: string; runIds: string[] }>()

    const { runs, reportId, handleRequestFormSubmit, reset } = useRunManager()

    await handleRequestFormSubmit({ url: 'https://example.com' })
    const submit = handleRequestFormSubmit({ url: 'https://example.com' })
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3))
    reset()
    save.resolve({ reportId: 'report-1', runIds: ['run-1', 'run-2'] })
    await submit

    expect(runs.value).toEqual([])
    expect(reportId.value).toBe(null)
    expect(navigateTo).toHaveBeenCalledTimes(1)
    expect(navigateTo).toHaveBeenLastCalledWith('/run/run-1')
  })

  it('does not navigate when the user moves on during the report save', async () => {
    resolveFetchOnce(apiRun('run-1'))
    resolveFetchOnce(apiRun('run-2'))
    const save = deferFetchOnce<{ reportId: string; runIds: string[] }>()
    const load = deferFetchOnce<ApiRun>()

    const { handleRequestFormSubmit, loadRun } = useRunManager()

    await handleRequestFormSubmit({ url: 'https://example.com' })
    const submit = handleRequestFormSubmit({ url: 'https://example.com' })
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3))

    const loading = loadRun('run-1')
    save.resolve({ reportId: 'report-1', runIds: ['run-1', 'run-2'] })
    load.resolve(apiRun('run-1'))
    await submit
    await loading

    expect(navigateTo).toHaveBeenCalledTimes(1)
    expect(navigateTo).toHaveBeenLastCalledWith('/run/run-1')
  })

  it('drops an inspection that started before a permalink load', async () => {
    const inspect = deferFetchOnce<ApiRun>()
    const load = deferFetchOnce<ApiRun>()

    const { runs, error, handleRequestFormSubmit, loadRun } = useRunManager()

    const submit = handleRequestFormSubmit({ url: 'https://example.com' })
    const loading = loadRun('run-1')
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))

    inspect.resolve(apiRun('run-9'))
    await submit
    load.resolve(apiRun('run-1'))
    await loading

    expect(runs.value.map((run) => run.runId)).toEqual(['run-1'])
    expect(error.value).toBe(null)
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('handles API request error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('HTTP 500'))

    const { runs, error, loading, handleRequestFormSubmit } = useRunManager()

    await handleRequestFormSubmit({ url: 'https://example.com' })

    expect(loading.value).toBe(false)
    expect(error.value).toBeTruthy()
    expect(runs.value).toHaveLength(0)
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('refuses to inspect another URL once the report is full', async () => {
    const runs = Array.from({ length: MAX_RUNS_PER_REPORT }, (_, i) => apiRun(`run-${i}`))
    resolveFetchOnce({ reportId: 'report-1', runIds: runs.map((run) => run.runId), runs })

    const { error, handleRequestFormSubmit, loadReport } = useRunManager()

    await loadReport('report-1')
    await handleRequestFormSubmit({ url: 'https://example.com' })

    expect(error.value).toContain(`at most ${MAX_RUNS_PER_REPORT}`)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('clears runs and navigates home when handleClickClear is called', async () => {
    resolveFetchOnce(apiRun('run-1'))

    const { runs, reportId, error, handleRequestFormSubmit, handleClickClear } = useRunManager()

    await handleRequestFormSubmit({ url: 'https://example.com' })
    expect(runs.value).toHaveLength(1)

    await handleClickClear()

    expect(runs.value).toHaveLength(0)
    expect(reportId.value).toBe(null)
    expect(error.value).toBe(null)
    expect(navigateTo).toHaveBeenLastCalledWith('/')
  })

  describe('loadRun', () => {
    it('fetches the run and replaces the current runs', async () => {
      resolveFetchOnce(apiRun('run-1'))

      const { runs, loadRun } = useRunManager()

      await loadRun('run-1')

      expect(runs.value).toHaveLength(1)
      expect(runs.value[0]?.runId).toBe('run-1')
      expect(runs.value[0]?.cacheHeaders).toEqual({ 'cache-control': 'max-age=3600' })
      expect(mockFetch).toHaveBeenCalledWith('/api/runs/run-1')
    })

    it('skips the fetch when that run is already the only one loaded', async () => {
      resolveFetchOnce(apiRun('run-1'))

      const { loadRun } = useRunManager()

      await loadRun('run-1')
      await loadRun('run-1')

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('clears a lingering error from a previous page', async () => {
      mockFetch.mockRejectedValueOnce(new Error('HTTP 500'))
      resolveFetchOnce(apiRun('run-1'))

      const { error, handleRequestFormSubmit, loadRun } = useRunManager()

      await handleRequestFormSubmit({ url: 'https://example.com' })
      await loadRun('run-1')

      expect(error.value).toBe(null)
    })

    it('ignores a response that arrives after another page was loaded', async () => {
      const first = deferFetchOnce<ApiRun>()
      resolveFetchOnce(apiRun('run-2'))

      const { runs, loadRun } = useRunManager()

      const load = loadRun('run-1')
      await loadRun('run-2')
      first.resolve(apiRun('run-1'))
      await load

      expect(runs.value.map((run) => run.runId)).toEqual(['run-2'])
    })

    it('encodes the run ID in the request path', async () => {
      resolveFetchOnce(apiRun('run-1'))

      const { loadRun } = useRunManager()

      await loadRun('../x')

      expect(mockFetch).toHaveBeenCalledWith('/api/runs/..%2Fx')
    })

    it('clears the runs when the permalink fails to load', async () => {
      resolveFetchOnce(apiRun('run-1'))

      const { runs, loadRun } = useRunManager()

      await loadRun('run-1')
      mockFetch.mockRejectedValueOnce(new Error('HTTP 404'))

      await expect(loadRun('run-2')).rejects.toThrow('HTTP 404')
      expect(runs.value).toEqual([])
    })
  })

  describe('loadReport', () => {
    const report: ApiReportWithRuns = {
      reportId: 'report-1',
      runIds: ['run-1', 'run-2'],
      runs: [apiRun('run-1'), apiRun('run-2')],
    }

    it('fetches the report and loads its runs', async () => {
      resolveFetchOnce(report)

      const { runs, reportId, loadReport } = useRunManager()

      await loadReport('report-1')

      expect(runs.value.map((run) => run.runId)).toEqual(['run-1', 'run-2'])
      expect(reportId.value).toBe('report-1')
      expect(mockFetch).toHaveBeenCalledWith('/api/reports/report-1')
    })

    it('skips the fetch when that report is already loaded', async () => {
      resolveFetchOnce(report)

      const { loadReport } = useRunManager()

      await loadReport('report-1')
      await loadReport('report-1')

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('refetches when a different report is requested', async () => {
      resolveFetchOnce(report)
      resolveFetchOnce({ ...report, reportId: 'report-2' })

      const { reportId, loadReport } = useRunManager()

      await loadReport('report-1')
      await loadReport('report-2')

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(reportId.value).toBe('report-2')
    })

    it('ignores a response that arrives after another report was loaded', async () => {
      const first = deferFetchOnce<ApiReportWithRuns>()
      const second = { ...report, reportId: 'report-2', runs: [apiRun('run-9')] }
      resolveFetchOnce(second)

      const { runs, reportId, loadReport } = useRunManager()

      const load = loadReport('report-1')
      await loadReport('report-2')
      first.resolve(report)
      await load

      expect(reportId.value).toBe('report-2')
      expect(runs.value.map((run) => run.runId)).toEqual(['run-9'])
    })
  })

  it('resets all state', async () => {
    resolveFetchOnce(apiRun('run-1'))
    mockFetch.mockRejectedValueOnce(new Error('HTTP 500'))

    const { runs, error, reportId, handleRequestFormSubmit, reset } = useRunManager()

    await handleRequestFormSubmit({ url: 'https://example.com' })
    await handleRequestFormSubmit({ url: 'https://example.com' })
    expect(error.value).toBeTruthy()

    reset()

    expect(runs.value).toEqual([])
    expect(reportId.value).toBe(null)
    expect(error.value).toBe(null)
  })
})
