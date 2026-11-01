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

const findRow = (wrapper: ReturnType<typeof mountWithHeaders>, labelPrefix: string) =>
  wrapper.findAll('.data-row').find((row) => row.find('dt').text().startsWith(labelPrefix))

describe('CacheAnalysis', () => {
  describe('warnings', () => {
    it('renders no warnings list for a well-formed configuration', () => {
      const wrapper = mountWithHeaders({
        'Cache-Status': '"Netlify Edge"; hit; ttl=50',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
        Age: '10',
      })

      expect(wrapper.find('.warnings').exists()).toBe(false)
      wrapper.unmount()
    })

    it('renders a warning per misconfiguration with the detail as a tooltip', () => {
      const wrapper = mountWithHeaders({
        'Cache-Status': '"Netlify Edge"; hit; ttl=50',
        'Cache-Control': 'public, maxage=60, stale-while-revalidate=60',
        'Debug-Netlify-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60',
        Age: '10',
      })

      const warnings = wrapper.findAll('.warning')
      expect(warnings).toHaveLength(3)
      expect(warnings[0]?.text()).toContain('Cache-Control')
      expect(warnings[0]?.text()).toContain('Did you mean "max-age"?')
      expect(warnings[1]?.text()).toContain('without max-age or s-maxage')
      expect(warnings[2]?.text()).toContain('Netlify-CDN-Cache-Control')
      expect(warnings[2]?.text()).toContain('same value as s-maxage (60)')
      expect(warnings[2]?.attributes('title')).toContain('extra grace window')
      expect(warnings[2]?.attributes('title')).toContain('Learn more: https://docs.netlify.com')
      wrapper.unmount()
    })
  })

  describe('stale-while-revalidate', () => {
    it('does not render stale-while-revalidate rows when the directive is absent', () => {
      const wrapper = mountWithHeaders({
        'Cache-Status': '"Netlify Edge"; hit; ttl=50',
        'Cache-Control': 'public, max-age=60',
        Age: '10',
      })

      expect(wrapper.text()).not.toContain('SWR')
      expect(wrapper.text()).not.toContain('stale')
      wrapper.unmount()
    })

    it('renders the stale-while-revalidate window while the response is still fresh', () => {
      const wrapper = mountWithHeaders({
        'Cache-Status': '"Netlify Edge"; hit; ttl=50',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
        Age: '10',
      })

      expect(wrapper.text()).toContain('SWR')
      expect(wrapper.text()).toContain('600 s')
      expect(wrapper.findAll('.state-chip')).toHaveLength(0)
      wrapper.unmount()
    })

    it('flags a stale response served within its stale-while-revalidate window', () => {
      const wrapper = mountWithHeaders({
        'Cache-Status': '"Netlify Edge"; hit; ttl=-40',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
        Age: '100',
      })

      const hitRows = findRowTexts(wrapper, 'Hit')
      expect(hitRows[0]).toContain('served stale')
      const browserTtlRow = findRow(wrapper, 'TTL (browser)')
      expect(browserTtlRow?.text()).toContain('-40 s')
      expect(browserTtlRow?.text()).toContain('SWR · 560 s left')
      expect(browserTtlRow?.find('.state-chip').attributes('title')).toContain('SWR window')
      expect(findRowTexts(wrapper, 'SWR')[0]).toContain('600 s')
      expect(findRowTexts(wrapper, 'SWR')[0]).not.toContain('left')
      wrapper.unmount()
    })

    it('flags an edge hit forwarded because stale as served stale', () => {
      const wrapper = mountWithHeaders({
        'Cache-Status': '"Netlify Edge"; hit; fwd=stale',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
        Age: '100',
      })

      const hitRows = findRowTexts(wrapper, 'Hit')
      expect(hitRows[0]).toContain('served stale')
      wrapper.unmount()
    })

    it('flags a stale response whose stale-while-revalidate window has elapsed', () => {
      const wrapper = mountWithHeaders({
        'Cache-Status': '"Netlify Edge"; fwd=stale; fwd-status=200; stored',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
        Age: '700',
      })

      const browserTtlRow = findRow(wrapper, 'TTL (browser)')
      expect(browserTtlRow?.text()).toContain('stale')
      expect(browserTtlRow?.text()).not.toContain('served stale')
      expect(browserTtlRow?.find('.state-chip').attributes('title')).toContain('both elapsed')
      wrapper.unmount()
    })

    it('flags a stale response whose stale-while-revalidate window is forbidden by must-revalidate', () => {
      const wrapper = mountWithHeaders({
        'Cache-Status': '"Netlify Edge"; fwd=stale; fwd-status=200; stored',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=600, must-revalidate',
        Age: '100',
      })

      const ttlRows = findRowTexts(wrapper, 'TTL')
      expect(ttlRows).toHaveLength(3)
      for (const row of ttlRows) {
        expect(row).toContain('blocked')
      }
      const browserTtlRow = findRow(wrapper, 'TTL (browser)')
      expect(browserTtlRow?.find('.state-chip').attributes('title')).toContain(
        'must-revalidate forbids serving stale',
      )
      const swrRows = findRowTexts(wrapper, 'SWR')
      expect(swrRows).toHaveLength(3)
      for (const row of swrRows) {
        expect(row).toContain('600 s')
        expect(row).not.toContain('blocked')
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

      const swrRows = findRowTexts(wrapper, 'SWR')
      expect(swrRows).toHaveLength(3)
      expect(swrRows[0]).toContain('SWR (browser)')
      expect(swrRows[0]).toContain('600 s')
      // No CDN-Cache-Control, so the CDN tier falls back to Cache-Control's window
      expect(swrRows[1]).toContain('SWR (other CDNs)')
      expect(swrRows[1]).toContain('600 s')
      expect(swrRows[2]).toContain('SWR (Netlify CDN)')
      expect(swrRows[2]).toContain('1200 s')
      wrapper.unmount()
    })

    it('labels SWR rows compactly and expands the term in the tooltip', () => {
      const wrapper = mountWithHeaders({
        'Cache-Status': '"Netlify Edge"; hit; ttl=50',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
        Age: '10',
      })

      const swrRow = findRow(wrapper, 'SWR (browser)')
      const label = swrRow?.find('dt')
      expect(label?.text()).toBe('SWR (browser)')
      expect(label?.attributes('title')).toContain('Stale-while-revalidate')
      expect(label?.attributes('aria-label')).toContain('Stale-while-revalidate')
      wrapper.unmount()
    })
  })
})
