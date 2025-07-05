/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RunDisplay from './RunDisplay.vue'
import type { Run } from '~/types/run'

// Mock the child components
vi.mock('./RunPanel.vue', () => ({
  default: {
    name: 'RunPanel',
    template: '<div class="run-panel-mock">{{ runId }}-{{ showRawHeaders }}</div>',
    props: ['runId', 'url', 'status', 'durationInMs', 'cacheHeaders', 'enableDiffOnHover', 'showRawHeaders'],
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
        error: null,
        loading: true,
        onClear: vi.fn(),
      },
    })

    expect(wrapper.find('.loading-indicator').exists()).toBe(true)
    expect(wrapper.find('.loading-indicator').text()).toBe('⏳ Inspecting URL...')
  })

  it('shows error message when error exists', () => {
    const errorMessage = 'Test error message'
    const wrapper = mount(RunDisplay, {
      props: {
        runs: [],
        error: errorMessage,
        loading: false,
        onClear: vi.fn(),
      },
    })

    expect(wrapper.find('.error').exists()).toBe(true)
    expect(wrapper.find('.error').text()).toBe(errorMessage)
  })

  it('renders run panels for each run', () => {
    const wrapper = mount(RunDisplay, {
      props: {
        runs: mockRuns,
        error: null,
        loading: false,
        onClear: vi.fn(),
      },
    })

    const runPanels = wrapper.findAll('.run-panel-mock')
    expect(runPanels).toHaveLength(2)
    expect(runPanels[0]?.text()).toBe('test-run-1-false')
    expect(runPanels[1]?.text()).toBe('test-run-2-false')
  })

  it('shows raw headers toggle when runs exist', () => {
    const wrapper = mount(RunDisplay, {
      props: {
        runs: mockRuns,
        error: null,
        loading: false,
        onClear: vi.fn(),
      },
    })

    const toggleLabel = wrapper.find('.toggle-raw-headers-label')
    expect(toggleLabel.exists()).toBe(true)
    expect(toggleLabel.text()).toBe('Show raw headers')

    const checkbox = wrapper.find('.toggle-raw-headers-checkbox')
    expect(checkbox.exists()).toBe(true)
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)
  })

  it('hides raw headers toggle when no runs exist', () => {
    const wrapper = mount(RunDisplay, {
      props: {
        runs: [],
        error: null,
        loading: false,
        onClear: vi.fn(),
      },
    })

    expect(wrapper.find('.toggle-raw-headers-label').exists()).toBe(false)
  })

  it('passes showRawHeaders prop to run panels when toggled', async () => {
    const wrapper = mount(RunDisplay, {
      props: {
        runs: mockRuns,
        error: null,
        loading: false,
        onClear: vi.fn(),
      },
    })

    const checkbox = wrapper.find('.toggle-raw-headers-checkbox')
    await checkbox.setValue(true)

    const runPanels = wrapper.findAll('.run-panel-mock')
    expect(runPanels[0]?.text()).toBe('test-run-1-true')
    expect(runPanels[1]?.text()).toBe('test-run-2-true')
  })

  it('shows clear button when runs exist', () => {
    const mockOnClear = vi.fn()
    const wrapper = mount(RunDisplay, {
      props: {
        runs: mockRuns,
        error: null,
        loading: false,
        onClear: mockOnClear,
      },
    })

    const clearButton = wrapper.find('button')
    expect(clearButton.exists()).toBe(true)
    expect(clearButton.text()).toBe('Clear')
  })

  it('hides clear button when no runs exist', () => {
    const wrapper = mount(RunDisplay, {
      props: {
        runs: [],
        error: null,
        loading: false,
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
        error: null,
        loading: false,
        onClear: mockOnClear,
      },
    })

    await wrapper.find('button').trigger('click')
    expect(mockOnClear).toHaveBeenCalledOnce()
  })
})
