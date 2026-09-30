/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import RunDisplay from './RunDisplay.vue'
import type { Run } from '~/types/run'

// Mock the child components
vi.mock('./RunPanel.vue', () => ({
  default: {
    name: 'RunPanel',
    template: '<div class="run-panel-mock">{{ runId }}</div>',
    props: [
      'runId',
      'url',
      'status',
      'durationInMs',
      'cacheHeaders',
      'enableDiffOnHover',
      'showUrl',
    ],
  },
}))

describe('RunDisplay', () => {
  const mockRuns: Run[] = [
    {
      runId: 'test-run-1',
      url: 'https://example.com',
      status: 200,
      durationInMs: 100,
      cacheHeaders: {},
    },
    {
      runId: 'test-run-2',
      url: 'https://example2.com',
      status: 404,
      durationInMs: 200,
      cacheHeaders: {},
    },
  ]

  it('shows loading indicator when loading', () => {
    const wrapper = mount(RunDisplay, {
      props: {
        runs: [],
        reportId: null,
        error: null,
        loading: true,
        inputUrl: '',
        onClear: vi.fn(),
      },
    })

    const loading = wrapper.find('[data-testid="loading-indicator"]')
    expect(loading.exists()).toBe(true)
    expect(loading.text()).toBe('Inspecting URL...')
  })

  it('shows error message when error exists', () => {
    const errorMessage = 'Test error message'
    const wrapper = mount(RunDisplay, {
      props: {
        runs: [],
        reportId: null,
        error: errorMessage,
        loading: false,
        inputUrl: '',
        onClear: vi.fn(),
      },
    })

    const error = wrapper.find('[data-testid="error"]')
    expect(error.exists()).toBe(true)
    expect(error.text()).toBe(errorMessage)
  })

  it('renders run panels for each run', () => {
    const wrapper = mount(RunDisplay, {
      props: {
        runs: mockRuns,
        reportId: null,
        error: null,
        loading: false,
        inputUrl: '',
        onClear: vi.fn(),
      },
    })

    const runPanels = wrapper.findAll('.run-panel-mock')
    expect(runPanels).toHaveLength(2)
    expect(runPanels[0]?.text()).toBe('test-run-1')
    expect(runPanels[1]?.text()).toBe('test-run-2')
  })

  it('shows clear button when runs exist', () => {
    const mockOnClear = vi.fn()
    const wrapper = mount(RunDisplay, {
      props: {
        runs: mockRuns,
        reportId: null,
        error: null,
        loading: false,
        inputUrl: '',
        onClear: mockOnClear,
      },
    })

    const clearButton = wrapper.find('button')
    expect(clearButton.exists()).toBe(true)
    expect(clearButton.text()).toBe('Clear runs')
  })

  it('hides clear button when no runs exist', () => {
    const wrapper = mount(RunDisplay, {
      props: {
        runs: [],
        reportId: null,
        error: null,
        loading: false,
        inputUrl: '',
        onClear: vi.fn(),
      },
    })

    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('calls onClear when clear button is clicked', async () => {
    const mockOnClear = vi.fn()
    const wrapper = mount(RunDisplay, {
      props: {
        runs: mockRuns,
        reportId: null,
        error: null,
        loading: false,
        inputUrl: '',
        onClear: mockOnClear,
      },
    })

    await wrapper.find('button').trigger('click')
    expect(mockOnClear).toHaveBeenCalledOnce()
  })

  describe('report link', () => {
    const writeText = vi.fn()

    beforeEach(() => {
      vi.useFakeTimers()
      vi.stubGlobal('navigator', { clipboard: { writeText } })
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.unstubAllGlobals()
      writeText.mockReset()
    })

    it('hides the copy button when there is no report', () => {
      const wrapper = mount(RunDisplay, {
        props: {
          runs: mockRuns,
          reportId: null,
          error: null,
          loading: false,
          inputUrl: '',
          onClear: vi.fn(),
        },
      })

      expect(wrapper.find('[data-testid="copy-report-link"]').exists()).toBe(false)
    })

    it('copies the report permalink and confirms briefly', async () => {
      writeText.mockResolvedValueOnce(undefined)
      const wrapper = mount(RunDisplay, {
        props: {
          runs: mockRuns,
          reportId: 'abc123def456',
          error: null,
          loading: false,
          inputUrl: '',
          onClear: vi.fn(),
        },
      })

      const button = wrapper.find('[data-testid="copy-report-link"]')
      expect(button.text()).toBe('Copy report link')

      await button.trigger('click')
      await flushPromises()

      expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/report/abc123def456`)
      expect(button.text()).toBe('Link copied!')

      vi.advanceTimersByTime(2000)
      await nextTick()
      expect(button.text()).toBe('Copy report link')
    })

    it('leaves the label unchanged when the clipboard is unavailable', async () => {
      writeText.mockRejectedValueOnce(new Error('denied'))
      const wrapper = mount(RunDisplay, {
        props: {
          runs: mockRuns,
          reportId: 'abc123def456',
          error: null,
          loading: false,
          inputUrl: '',
          onClear: vi.fn(),
        },
      })

      const button = wrapper.find('[data-testid="copy-report-link"]')
      await button.trigger('click')
      await flushPromises()

      expect(button.text()).toBe('Copy report link')
    })
  })
})
