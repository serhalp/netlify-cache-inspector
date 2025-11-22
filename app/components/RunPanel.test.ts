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

  it('renders toggle button', () => {
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

    const toggleButton = wrapper.find('.toggle-button')
    expect(toggleButton.exists()).toBe(true)
    expect(toggleButton.text()).toBe('Show raw headers')
  })

  it('hides raw headers by default', () => {
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

    expect(wrapper.find('.raw-cache-headers-mock').exists()).toBe(false)
  })

  it('toggles raw headers when button is clicked', async () => {
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

    const toggleButton = wrapper.find('.toggle-button')

    // Initially hidden
    expect(wrapper.find('.raw-cache-headers-mock').exists()).toBe(false)
    expect(toggleButton.text()).toBe('Show raw headers')

    // Click to show
    await toggleButton.trigger('click')
    expect(wrapper.find('.raw-cache-headers-mock').exists()).toBe(true)
    expect(toggleButton.text()).toBe('Hide raw headers')

    // Click to hide
    await toggleButton.trigger('click')
    expect(wrapper.find('.raw-cache-headers-mock').exists()).toBe(false)
    expect(toggleButton.text()).toBe('Show raw headers')
  })

  it('has proper accessibility attributes', () => {
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

    const toggleButton = wrapper.find('.toggle-button')
    expect(toggleButton.attributes('aria-expanded')).toBe('false')
    expect(toggleButton.attributes('title')).toBe('Show raw headers')
  })

  it('updates accessibility attributes when toggled', async () => {
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

    const toggleButton = wrapper.find('.toggle-button')
    await toggleButton.trigger('click')

    expect(toggleButton.attributes('aria-expanded')).toBe('true')
    expect(toggleButton.attributes('title')).toBe('Hide raw headers')
  })
})
