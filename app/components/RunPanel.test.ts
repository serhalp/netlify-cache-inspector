/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RunPanel from './RunPanel.vue'

// Mock the components that RunPanel uses
vi.mock('./CacheAnalysis.vue', () => ({
  default: {
    name: 'CacheAnalysis',
    template: '<div class="cache-analysis-mock">Cache Analysis</div>',
  },
}))

vi.mock('./RawCacheHeaders.vue', () => ({
  default: {
    name: 'RawCacheHeaders',
    template: '<div class="raw-cache-headers-mock">Raw Cache Headers</div>',
  },
}))

const mockProps = {
  runId: 'test-run-id',
  url: 'https://example.com',
  status: 200,
  durationInMs: 150,
  cacheHeaders: {
    'cache-control': 'max-age=3600',
    'etag': '"abc123"',
  },
  enableDiffOnHover: false,
  showRawHeaders: false,
}

describe('RunPanel', () => {
  it('renders basic information correctly', () => {
    const wrapper = mount(RunPanel, {
      props: mockProps,
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    expect(wrapper.text()).toContain('https://example.com')
    expect(wrapper.text()).toContain('HTTP 200 (150 ms)')
    expect(wrapper.find('.cache-analysis-mock').exists()).toBe(true)
  })

  it('renders permalink correctly', () => {
    const wrapper = mount(RunPanel, {
      props: mockProps,
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    const permalink = wrapper.find('.run-permalink')
    expect(permalink.exists()).toBe(true)
    expect(permalink.attributes('href')).toBe('/run/test-run-id')
    expect(permalink.text()).toBe('🔗 Permalink')
  })

  it('hides raw headers when showRawHeaders prop is false', () => {
    const wrapper = mount(RunPanel, {
      props: { ...mockProps, showRawHeaders: false },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    expect(wrapper.find('.raw-cache-headers-mock').exists()).toBe(false)
  })

  it('shows raw headers when showRawHeaders prop is true', () => {
    const wrapper = mount(RunPanel, {
      props: { ...mockProps, showRawHeaders: true },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    expect(wrapper.find('.raw-cache-headers-mock').exists()).toBe(true)
  })
})
