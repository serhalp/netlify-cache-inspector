/**
 * @vitest-environment happy-dom
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

  it('renders toggle control with static label', () => {
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

    const toggleControl = wrapper.find('.toggle-control')
    expect(toggleControl.exists()).toBe(true)
    expect(toggleControl.text()).toBe('Show raw headers')

    const toggleLabel = wrapper.find('.toggle-label')
    expect(toggleLabel.exists()).toBe(true)
    expect(toggleLabel.text()).toBe('Show raw headers')
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
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)
  })

  it('toggles raw headers when checkbox is toggled', async () => {
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

    const checkbox = wrapper.find('input[type="checkbox"]')

    // Initially hidden
    expect(wrapper.find('.raw-cache-headers-mock').exists()).toBe(false)
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)

    // Check to show
    await checkbox.setValue(true)
    expect(wrapper.find('.raw-cache-headers-mock').exists()).toBe(true)
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)

    // Uncheck to hide
    await checkbox.setValue(false)
    expect(wrapper.find('.raw-cache-headers-mock').exists()).toBe(false)
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)
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

    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.attributes('aria-label')).toContain('Show raw headers for')
    expect(checkbox.attributes('aria-label')).toContain('https://example.com')
  })

  it('label text remains static regardless of toggle state', async () => {
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

    const toggleLabel = wrapper.find('.toggle-label')
    expect(toggleLabel.text()).toBe('Show raw headers')

    // Toggle the checkbox
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(true)

    // Label should remain the same
    expect(toggleLabel.text()).toBe('Show raw headers')
  })
})
