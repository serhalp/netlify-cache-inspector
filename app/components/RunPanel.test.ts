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
  showUrl: true,
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
    expect(wrapper.text()).toContain('HTTP 200')
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

    const permalink = wrapper.find('a[href="/run/test-run-id"]')
    expect(permalink.exists()).toBe(true)
    expect(permalink.text()).toContain('Permalink')
  })

  it('displays status and duration', () => {
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

    expect(wrapper.text()).toContain('HTTP 200')
    expect(wrapper.text()).toContain('150ms')
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

    const toggleLabel = wrapper.find('label')
    expect(toggleLabel.exists()).toBe(true)
    expect(toggleLabel.text()).toContain('Show raw headers')
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

  it('hides URL when showUrl is false', () => {
    const wrapper = mount(RunPanel, {
      props: { ...mockProps, showUrl: false },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    expect(wrapper.find('h3').exists()).toBe(false)
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

    const label = wrapper.find('label')
    expect(label.text()).toContain('Show raw headers')

    // Toggle the checkbox
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(true)

    // Label should remain the same
    expect(label.text()).toContain('Show raw headers')
  })
})
