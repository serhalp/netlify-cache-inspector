import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RequestForm from './RequestForm.vue'

describe('RequestForm', () => {
  it('shows correct button text when not loading', () => {
    const wrapper = mount(RequestForm)
    expect(wrapper.find('button').text()).toBe('Inspect')
  })

  it('shows correct button text when loading', () => {
    const wrapper = mount(RequestForm, {
      props: { loading: true }
    })
    expect(wrapper.find('button').text()).toBe('Inspecting...')
  })

  it('disables button when loading', () => {
    const wrapper = mount(RequestForm, {
      props: { loading: true }
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
      props: { loading: true }
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })
})