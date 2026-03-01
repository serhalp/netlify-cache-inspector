/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RequestForm from './RequestForm.vue'

describe('RequestForm', () => {
  it('displays "Inspect" button text when not in loading state', () => {
    const wrapper = mount(RequestForm)
    expect(wrapper.find('button').text()).toBe('Inspect')
  })

  it('displays "Inspecting..." button text when in loading state', () => {
    const wrapper = mount(RequestForm, {
      props: { loading: true },
    })
    expect(wrapper.find('button').text()).toBe('Inspecting...')
  })

  it('disables button when loading', () => {
    const wrapper = mount(RequestForm, {
      props: { loading: true },
    })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('does not disable button when not loading', () => {
    const wrapper = mount(RequestForm)
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
  })

  it('emits submit event when not loading', async () => {
    const wrapper = mount(RequestForm)
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('does not emit submit event when loading', async () => {
    const wrapper = mount(RequestForm, {
      props: { loading: true },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('uses default URL when no initialUrl prop is provided', () => {
    const wrapper = mount(RequestForm)
    const input = wrapper.find('input')
    expect(input.element.value).toBe(
      'https://nextjs-netlify-durable-cache-demo.netlify.app/isr-page',
    )
  })

  it('uses inputUrl model value when provided', () => {
    const customUrl = 'https://example.com/test-page'
    const wrapper = mount(RequestForm, {
      props: { inputUrl: customUrl },
    })
    const input = wrapper.find('input')
    expect(input.element.value).toBe(customUrl)
  })
})
