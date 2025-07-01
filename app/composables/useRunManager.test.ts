/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRunManager } from './useRunManager'
import type { ApiRun } from '~/types/run'

// Mock the getCacheHeaders function
vi.mock('~/utils/getCacheHeaders', () => ({
  default: vi.fn((headers: Record<string, string>) => headers),
}))

// Mock fetch and $fetch
global.fetch = vi.fn()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.$fetch = vi.fn() as any

describe('useRunManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const { runs, error, loading } = useRunManager()

    expect(runs.value).toEqual([])
    expect(error.value).toBe(null)
    expect(loading.value).toBe(false)
  })

  it('transforms ApiRun to Run correctly', () => {
    const { getRunFromApiRun } = useRunManager()

    const apiRun: ApiRun = {
      runId: 'test-run',
      url: 'https://example.com',
      status: 200,
      durationInMs: 100,
      headers: { 'cache-control': 'max-age=3600' },
      reportId: 'test-report',
    }

    const run = getRunFromApiRun(apiRun)

    expect(run).toEqual({
      runId: 'test-run',
      url: 'https://example.com',
      status: 200,
      durationInMs: 100,
      cacheHeaders: { 'cache-control': 'max-age=3600' },
    })
  })

  it('handles successful API request', async () => {
    const mockApiRun: ApiRun = {
      runId: 'test-run',
      url: 'https://example.com',
      status: 200,
      durationInMs: 100,
      headers: { 'cache-control': 'max-age=3600' },
      reportId: 'test-report',
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockFetch = vi.mocked($fetch as any)
    mockFetch.mockResolvedValueOnce(mockApiRun)

    const { runs, error, loading, handleRequestFormSubmit } = useRunManager()

    await handleRequestFormSubmit({ url: 'https://example.com' })

    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
    expect(runs.value).toHaveLength(1)
    expect(runs.value[0]?.url).toBe('https://example.com')
    expect(mockFetch).toHaveBeenCalledWith('/api/inspect-url', {
      method: 'POST',
      body: { 
        url: 'https://example.com',
        currentReportId: null,
      },
    })
  })

  it('handles API request error', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockFetch = vi.mocked($fetch as any)
    mockFetch.mockRejectedValueOnce(new Error('HTTP 500'))

    const { runs, error, loading, handleRequestFormSubmit } = useRunManager()

    await handleRequestFormSubmit({ url: 'https://example.com' })

    expect(loading.value).toBe(false)
    expect(error.value).toBeTruthy()
    expect(runs.value).toHaveLength(0)
  })

  it('clears runs when handleClickClear is called', () => {
    const { runs, setRuns, handleClickClear } = useRunManager()

    // Add some runs first
    setRuns([{
      runId: 'test-run',
      url: 'https://example.com',
      status: 200,
      durationInMs: 100,
      cacheHeaders: {},
    }])

    expect(runs.value).toHaveLength(1)

    handleClickClear()

    expect(runs.value).toHaveLength(0)
  })

  it('adds runs with addRun', () => {
    const { runs, addRun } = useRunManager()

    const run = {
      runId: 'test-run',
      url: 'https://example.com',
      status: 200,
      durationInMs: 100,
      cacheHeaders: {},
    }

    addRun(run)

    expect(runs.value).toHaveLength(1)
    expect(runs.value[0]).toEqual(run)
  })

  it('sets error with setError', () => {
    const { error, setError } = useRunManager()

    setError('Test error')

    expect(error.value).toBe('Test error')
  })
})
