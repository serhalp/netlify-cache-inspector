/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useRunManager } from './useRunManager'
import type { ApiRun, ApiReportWithRuns } from '~/types/run'

// Mock the getCacheHeaders function
vi.mock('~/utils/getCacheHeaders', () => ({
  default: vi.fn((headers: Record<string, string>) => headers),
}))

vi.mock('~/utils/getErrorMessage', () => ({
  default: vi.fn((err: unknown) => String(err)),
}))

// Plain refs stand in for Nuxt's shared state: each useRunManager() call gets fresh state here
mockNuxtImport('useState', async () => {
  const { ref } = await import('vue')
  return (_key: string, init: () => unknown) => ref(init())
})

const { navigateTo } = vi.hoisted(() => ({ navigateTo: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateTo)

// Mock fetch and $fetch
global.fetch = vi.fn()
// @ts-expect-error -- $fetch mock for tests
global.$fetch = vi.fn()

const mockFetch = vi.mocked($fetch)

const apiRun = (runId: string): ApiRun => ({
  runId,
  url: 'https://example.com',
  status: 200,
  durationInMs: 100,
  headers: { 'cache-control': 'max-age=3600' },
})

// @ts-expect-error -- Nuxt's $fetch types are too deeply recursive for mockResolvedValueOnce
const resolveFetchOnce = (value: unknown) => mockFetch.mockResolvedValueOnce(value)

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

  it('transforms ApiRun to Run correctly', () => {
    const { getRunFromApiRun } = useRunManager()

    const run = getRunFromApiRun(apiRun('test-run'))

    expect(run).toEqual({
      runId: 'test-run',
      url: 'https://example.com',
      status: 200,
      durationInMs: 100,
      cacheHeaders: { 'cache-control': 'max-age=3600' },
    })
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

    const { runs, reportId, error, handleRequestFormSubmit } = useRunManager()

    await handleRequestFormSubmit({ url: 'https://example.com' })
    await handleRequestFormSubmit({ url: 'https://example.com' })

    expect(runs.value).toHaveLength(2)
    expect(reportId.value).toBe(null)
    expect(error.value).toContain('Could not create a report permalink')
    expect(navigateTo).toHaveBeenCalledTimes(1)
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

      const runIds = await loadRun('run-1')

      expect(runIds).toEqual(['run-1'])
      expect(runs.value).toHaveLength(1)
      expect(runs.value[0]?.runId).toBe('run-1')
      expect(mockFetch).toHaveBeenCalledWith('/api/runs/run-1')
    })

    it('skips the fetch when that run is already the only one loaded', async () => {
      resolveFetchOnce(apiRun('run-1'))

      const { loadRun } = useRunManager()

      await loadRun('run-1')
      await loadRun('run-1')

      expect(mockFetch).toHaveBeenCalledTimes(1)
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

      const runIds = await loadReport('report-1')

      expect(runIds).toEqual(['run-1', 'run-2'])
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
  })

  it('resets all state', async () => {
    resolveFetchOnce(apiRun('run-1'))

    const { runs, error, reportId, handleRequestFormSubmit, setError, reset } = useRunManager()

    await handleRequestFormSubmit({ url: 'https://example.com' })
    setError('Test error')
    reset()

    expect(runs.value).toEqual([])
    expect(reportId.value).toBe(null)
    expect(error.value).toBe(null)
  })

  it('sets error with setError', () => {
    const { error, setError } = useRunManager()

    setError('Test error')

    expect(error.value).toBe('Test error')
  })
})
