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

  it('shows toggle button for raw headers', () => {
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

    const toggleButton = wrapper.find('.toggle-raw-headers')
    expect(toggleButton.exists()).toBe(true)
    expect(toggleButton.text()).toBe('Show Raw Headers')
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

  it('shows raw headers when toggle button is clicked', async () => {
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

    const toggleButton = wrapper.find('.toggle-raw-headers')
    await toggleButton.trigger('click')

    expect(wrapper.find('.raw-cache-headers-mock').exists()).toBe(true)
    expect(toggleButton.text()).toBe('Hide Raw Headers')
  })

  it('hides raw headers when toggle button is clicked twice', async () => {
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

    const toggleButton = wrapper.find('.toggle-raw-headers')
    
    // Click to show
    await toggleButton.trigger('click')
    expect(wrapper.find('.raw-cache-headers-mock').exists()).toBe(true)
    expect(toggleButton.text()).toBe('Hide Raw Headers')

    // Click to hide
    await toggleButton.trigger('click')
    expect(wrapper.find('.raw-cache-headers-mock').exists()).toBe(false)
    expect(toggleButton.text()).toBe('Show Raw Headers')
  })

  it('updates button title attribute based on state', async () => {
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

    const toggleButton = wrapper.find('.toggle-raw-headers')
    
    // Initial state
    expect(toggleButton.attributes('title')).toBe('Show raw headers')

    // After clicking to show
    await toggleButton.trigger('click')
    expect(toggleButton.attributes('title')).toBe('Hide raw headers')

    // After clicking to hide again
    await toggleButton.trigger('click')
    expect(toggleButton.attributes('title')).toBe('Show raw headers')
  })
})