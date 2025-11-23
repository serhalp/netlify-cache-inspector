/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RunDisplay from './RunDisplay.vue'

describe('RunDisplay - Accessibility', () => {
  const mockRuns = [
    {
      runId: 'run-1',
      url: 'https://example.com',
      status: 200,
      durationInMs: 150,
      cacheHeaders: { 'cache-control': 'max-age=3600' },
    },
  ]

  it('loading indicator has proper ARIA attributes', () => {
    const wrapper = mount(RunDisplay, {
      props: {
        runs: [],
        error: null,
        loading: true,
        onClear: () => {},
      },
      global: {
        stubs: {
          RunPanel: true,
        },
      },
    })

    const loadingIndicator = wrapper.find('.loading-indicator')
    expect(loadingIndicator.exists()).toBe(true)
    expect(loadingIndicator.attributes('role')).toBe('status')
    expect(loadingIndicator.attributes('aria-live')).toBe('polite')
  })

  it('error message has proper ARIA role for alerts', () => {
    const wrapper = mount(RunDisplay, {
      props: {
        runs: [],
        error: 'Something went wrong',
        loading: false,
        onClear: () => {},
      },
      global: {
        stubs: {
          RunPanel: true,
        },
      },
    })

    const errorDiv = wrapper.find('.error')
    expect(errorDiv.exists()).toBe(true)
    expect(errorDiv.attributes('role')).toBe('alert')
    expect(errorDiv.attributes('aria-live')).toBe('assertive')
  })

  it('hides decorative emoji in loading indicator from screen readers', () => {
    const wrapper = mount(RunDisplay, {
      props: {
        runs: [],
        error: null,
        loading: true,
        onClear: () => {},
      },
      global: {
        stubs: {
          RunPanel: true,
        },
      },
    })

    const loadingIndicator = wrapper.find('.loading-indicator')
    const hiddenEmoji = loadingIndicator.find('[aria-hidden="true"]')
    expect(hiddenEmoji.exists()).toBe(true)
  })

  it('clear button is accessible when runs exist', () => {
    const onClear = vi.fn()
    const wrapper = mount(RunDisplay, {
      props: {
        runs: mockRuns,
        error: null,
        loading: false,
        onClear,
      },
      global: {
        stubs: {
          RunPanel: true,
        },
      },
    })

    const clearButton = wrapper.find('button')
    expect(clearButton.exists()).toBe(true)
    expect(clearButton.text()).toBe('Clear')
  })

  it('does not show clear button when no runs exist', () => {
    const wrapper = mount(RunDisplay, {
      props: {
        runs: [],
        error: null,
        loading: false,
        onClear: () => {},
      },
      global: {
        stubs: {
          RunPanel: true,
        },
      },
    })

    const clearButton = wrapper.find('button')
    expect(clearButton.exists()).toBe(false)
  })
})
