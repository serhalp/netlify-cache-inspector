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

// Rows are `.data-row` with a `dt` label; returns the text of the rows whose label matches.
const findRowTexts = (wrapper: ReturnType<typeof mountWithHeaders>, labelPrefix: string) =>
  wrapper
    .findAll('.data-row')
    .filter((row) => row.find('dt').text().startsWith(labelPrefix))
    .map((row) => row.text())

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

      const cacheStatusTtlRows = findRowTexts(wrapper, 'TTL')
      expect(cacheStatusTtlRows[0]).toContain('served stale')
      expect(cacheStatusTtlRows[1]).toContain('-40 s')
      expect(cacheStatusTtlRows[1]).toContain('stale')
      expect(findRowTexts(wrapper, 'Stale-while-revalidate')[0]).toContain(
        'stale but servable while revalidating, 560 s left',
      )
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

    it('flags a stale response whose stale-while-revalidate window is forbidden by must-revalidate', () => {
      const wrapper = mountWithHeaders({
        'Cache-Status': '"Netlify Edge"; fwd=stale; fwd-status=200; stored',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=600, must-revalidate',
        Age: '100',
      })

      const swrRows = findRowTexts(wrapper, 'Stale-while-revalidate')
      expect(swrRows).toHaveLength(3)
      for (const row of swrRows) {
        expect(row).toContain('stale, must-revalidate forbids serving stale')
        expect(row).not.toContain('servable')
      }
      wrapper.unmount()
    })

    it('labels per-tier stale-while-revalidate rows when CDN headers differ', () => {
      const wrapper = mountWithHeaders({
        'Cache-Status': '"Netlify Edge"; hit; ttl=50',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
        'Debug-Netlify-CDN-Cache-Control': 'public, s-maxage=120, stale-while-revalidate=1200',
        Age: '10',
      })

      const swrRows = findRowTexts(wrapper, 'Stale-while-revalidate')
      expect(swrRows).toHaveLength(3)
      expect(swrRows[0]).toContain('(browser)')
      expect(swrRows[0]).toContain('600 s')
      // No CDN-Cache-Control, so the CDN tier falls back to Cache-Control's window
      expect(swrRows[1]).toContain('(other CDNs)')
      expect(swrRows[1]).toContain('600 s')
      expect(swrRows[2]).toContain('(Netlify CDN)')
      expect(swrRows[2]).toContain('1200 s')
      wrapper.unmount()
    })
  })
})
