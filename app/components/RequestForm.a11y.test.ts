/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RequestForm from './RequestForm.vue'

describe('RequestForm - Accessibility', () => {
  it('has properly associated label with input', () => {
    const wrapper = mount(RequestForm, {
      props: {
        loading: false,
      },
    })

    const label = wrapper.find('label')
    const input = wrapper.find('input')

    expect(label.exists()).toBe(true)
    expect(input.exists()).toBe(true)

    // Check that label has 'for' attribute
    expect(label.attributes('for')).toBe('url-input')
    
    // Check that input has matching 'id' attribute
    expect(input.attributes('id')).toBe('url-input')
  })

  it('input has proper type attribute for URL', () => {
    const wrapper = mount(RequestForm, {
      props: {
        loading: false,
      },
    })

    const input = wrapper.find('input')
    expect(input.attributes('type')).toBe('url')
  })

  it('button has descriptive text', () => {
    const wrapper = mount(RequestForm, {
      props: {
        loading: false,
      },
    })

    const button = wrapper.find('button')
    expect(button.text()).toBe('Inspect')
  })

  it('button text changes when loading', () => {
    const wrapper = mount(RequestForm, {
      props: {
        loading: true,
      },
    })

    const button = wrapper.find('button')
    expect(button.text()).toBe('Inspecting...')
  })

  it('button is disabled during loading', () => {
    const wrapper = mount(RequestForm, {
      props: {
        loading: true,
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('form elements are keyboard accessible', () => {
    const wrapper = mount(RequestForm, {
      props: {
        loading: false,
      },
    })

    const input = wrapper.find('input')
    const button = wrapper.find('button')

    // Both should be in the tab order (not have negative tabindex)
    expect(input.attributes('tabindex')).not.toBe('-1')
    expect(button.attributes('tabindex')).not.toBe('-1')
  })

  it('supports Enter key to submit', async () => {
    const wrapper = mount(RequestForm, {
      props: {
        loading: false,
      },
    })

    const input = wrapper.find('input')
    
    // Simulate Enter key
    await input.trigger('keyup.enter')
    
    // Should emit submit event
    expect(wrapper.emitted('submit')).toBeTruthy()
  })
})
