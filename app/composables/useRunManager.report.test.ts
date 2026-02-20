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

// Mock navigateTo composable
vi.mock('#app/composables/router', () => ({
  navigateTo: vi.fn(async () => {}),
}))

// Mock fetch and $fetch
global.fetch = vi.fn()
vi.stubGlobal('$fetch', vi.fn())

describe('useRunManager - Report Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tracks currentReportId state', () => {
    const { currentReportId, setCurrentReportId } = useRunManager()

    expect(currentReportId.value).toBe(null)

    setCurrentReportId('test-report-123')
    expect(currentReportId.value).toBe('test-report-123')

    setCurrentReportId(null)
    expect(currentReportId.value).toBe(null)
  })

  it('sends currentReportId in API requests when set', async () => {
    const mockApiRun: ApiRun = {
      runId: 'test-run',
      url: 'https://example.com',
      status: 200,
      durationInMs: 100,
      headers: { 'cache-control': 'max-age=3600' },
      reportId: 'new-report-456',
    }

    const mockFetch = $fetch as unknown as ReturnType<typeof vi.fn>
    mockFetch.mockResolvedValueOnce(mockApiRun)

    const { handleRequestFormSubmit, setCurrentReportId, currentReportId } = useRunManager()

    setCurrentReportId('existing-report-123')

    await handleRequestFormSubmit({ url: 'https://example.com' })

    expect(mockFetch).toHaveBeenCalledWith('/api/inspect-url', {
      method: 'POST',
      body: {
        url: 'https://example.com',
        currentReportId: 'existing-report-123',
      },
    })

    // Should update to the new report ID returned from API
    expect(currentReportId.value).toBe('new-report-456')
  })

  it('updates currentReportId when API returns new reportId', async () => {
    const mockApiRun: ApiRun = {
      runId: 'test-run',
      url: 'https://example.com',
      status: 200,
      durationInMs: 100,
      headers: { 'cache-control': 'max-age=3600' },
      reportId: 'new-report-789',
    }

    const mockFetch = $fetch as unknown as ReturnType<typeof vi.fn>
    mockFetch.mockResolvedValueOnce(mockApiRun)

    const { handleRequestFormSubmit, currentReportId } = useRunManager()

    expect(currentReportId.value).toBe(null)

    await handleRequestFormSubmit({ url: 'https://example.com' })

    expect(currentReportId.value).toBe('new-report-789')
  })

  it('clears currentReportId when clearing runs', async () => {
    const { handleClickClear, setCurrentReportId, currentReportId } = useRunManager()

    setCurrentReportId('test-report-123')
    expect(currentReportId.value).toBe('test-report-123')

    await handleClickClear()

    expect(currentReportId.value).toBe(null)
  })

  it('handles API response without reportId', async () => {
    const mockApiRun: ApiRun = {
      runId: 'test-run',
      url: 'https://example.com',
      status: 200,
      durationInMs: 100,
      headers: { 'cache-control': 'max-age=3600' },
      // No reportId in response
    }

    const mockFetch = $fetch as unknown as ReturnType<typeof vi.fn>
    mockFetch.mockResolvedValueOnce(mockApiRun)

    const { handleRequestFormSubmit, currentReportId, setCurrentReportId } = useRunManager()

    setCurrentReportId('existing-report')

    await handleRequestFormSubmit({ url: 'https://example.com' })

    // Should keep existing reportId if API doesn't return one
    expect(currentReportId.value).toBe('existing-report')
  })
})
