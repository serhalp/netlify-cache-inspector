/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CacheAnalysis from './CacheAnalysis.vue'

const mountWithHeaders = (cacheHeaders: Record<string, string>) =>
  mount(CacheAnalysis, {
    props: { cacheHeaders, enableDiffOnHover: false },
  })

describe('CacheAnalysis', () => {
  describe('stale-while-revalidate', () => {
    it('does not render stale-while-revalidate rows when the directive is absent', () => {
      const wrapper = mountWithHeaders({
        'Cache-Status': '"Netlify Edge"; hit; ttl=50',
        'Cache-Control': 'public, max-age=60',
        Age: '10',
      })

      expect(wrapper.text()).not.toContain('Stale-while-revalidate')
      expect(wrapper.text()).not.toContain('stale')
      wrapper.unmount()
    })

    it('renders the stale-while-revalidate window while the response is still fresh', () => {
      const wrapper = mountWithHeaders({
        'Cache-Status': '"Netlify Edge"; hit; ttl=50',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
        Age: '10',
      })

      expect(wrapper.text()).toContain('Stale-while-revalidate')
      expect(wrapper.text()).toContain('600 s')
      expect(wrapper.text()).not.toContain('serving stale')
      expect(wrapper.text()).not.toContain('window elapsed')
      wrapper.unmount()
    })

    it('flags a stale response served within its stale-while-revalidate window', () => {
      const wrapper = mountWithHeaders({
        'Cache-Status': '"Netlify Edge"; hit; ttl=-40',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
        Age: '100',
      })

      const text = wrapper.text()
      expect(text).toContain('served stale')
      expect(text).toContain('-40 s')
      expect(text).toContain('serving stale while revalidating, 560 s left')
      wrapper.unmount()
    })

    it('flags a stale response whose stale-while-revalidate window has elapsed', () => {
      const wrapper = mountWithHeaders({
        'Cache-Status': '"Netlify Edge"; fwd=stale; fwd-status=200; stored',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
        Age: '700',
      })

      expect(wrapper.text()).toContain('stale, window elapsed')
      expect(wrapper.text()).not.toContain('served stale')
      wrapper.unmount()
    })

    it('labels per-tier stale-while-revalidate rows when CDN headers differ', () => {
      const wrapper = mountWithHeaders({
        'Cache-Status': '"Netlify Edge"; hit; ttl=50',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
        'Debug-Netlify-CDN-Cache-Control': 'public, s-maxage=120, stale-while-revalidate=1200',
        Age: '10',
      })

      const text = wrapper.text()
      expect(text).toContain('Stale-while-revalidate')
      expect(text).toContain('(browser)')
      expect(text).toContain('(Netlify CDN)')
      expect(text).toContain('600 s')
      expect(text).toContain('1200 s')
      wrapper.unmount()
    })
  })
})
