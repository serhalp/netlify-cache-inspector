import { describe, it, expect } from 'vitest'
import { getCacheNameTooltip, getForwardReasonTooltip, getFieldTooltip, formatTooltip } from '~/utils/tooltips'

describe('tooltip utilities', () => {
  describe('getCacheNameTooltip', () => {
    it('returns specific tooltip for Netlify Edge', () => {
      const tooltip = getCacheNameTooltip('Netlify Edge')
      expect(tooltip.text).toContain('Netlify\'s global edge cache layer')
      expect(tooltip.url).toBe('https://docs.netlify.com/platform/caching/')
    })

    it('returns specific tooltip for Netlify Durable', () => {
      const tooltip = getCacheNameTooltip('Netlify Durable')
      expect(tooltip.text).toContain('opt-in cache layer that is shared regionally')
      expect(tooltip.url).toBe('https://docs.netlify.com/build/caching/caching-overview/#durable-directive')
    })

    it('returns specific tooltip for Next.js', () => {
      const tooltip = getCacheNameTooltip('Next.js')
      expect(tooltip.text).toContain('Next.js application-level caching')
      expect(tooltip.url).toBe('https://nextjs.org/docs/app/guides/caching#full-route-cache')
    })

    it('returns generic tooltip for unknown cache names', () => {
      const tooltip = getCacheNameTooltip('Unknown Cache')
      expect(tooltip.text).toContain('Third-party cache layer "Unknown Cache"')
      expect(tooltip.url).toBeUndefined()
    })
  })

  describe('getForwardReasonTooltip', () => {
    it('returns specific tooltip for bypass', () => {
      const tooltip = getForwardReasonTooltip('bypass')
      expect(tooltip.text).toContain('The cache was configured to not store')
    })

    it('returns specific tooltip for method', () => {
      const tooltip = getForwardReasonTooltip('method')
      expect(tooltip.text).toContain('The request method was such that')
    })

    it('returns specific tooltip for uri-miss', () => {
      const tooltip = getForwardReasonTooltip('uri-miss')
      expect(tooltip.text).toContain('The cache did not have a stored response for this request URI')
    })

    it('returns specific tooltip for vary-miss', () => {
      const tooltip = getForwardReasonTooltip('vary-miss')
      expect(tooltip.text).toContain('Vary header field(s) differed')
    })

    it('returns generic tooltip for unknown forward reasons', () => {
      const tooltip = getForwardReasonTooltip('unknown-reason')
      expect(tooltip.text).toContain('Cache forwarding reason: unknown-reason')
    })
  })

  describe('getFieldTooltip', () => {
    it('returns specific tooltip for served-by', () => {
      const tooltip = getFieldTooltip('served-by')
      expect(tooltip.text).toContain('The service or component that ultimately served')
    })

    it('returns specific tooltip for cdn-nodes', () => {
      const tooltip = getFieldTooltip('cdn-nodes')
      expect(tooltip.text).toContain('The specific CDN node(s) that handled this request')
    })

    it('returns specific tooltip for netlify-vary with URL', () => {
      const tooltip = getFieldTooltip('netlify-vary')
      expect(tooltip.text).toContain('Netlify-specific header that controls cache key variation')
      expect(tooltip.url).toBe('https://docs.netlify.com/build/caching/caching-overview/#cache-key-variation')
    })

    it('returns generic tooltip for unknown fields', () => {
      const tooltip = getFieldTooltip('unknown-field')
      expect(tooltip.text).toContain('Information about unknown-field')
    })
  })

  describe('formatTooltip', () => {
    it('formats tooltip without URL', () => {
      const tooltip = { text: 'Simple tooltip text' }
      const formatted = formatTooltip(tooltip)
      expect(formatted).toBe('Simple tooltip text')
    })

    it('formats tooltip with URL', () => {
      const tooltip = {
        text: 'Tooltip text with link',
        url: 'https://example.com',
      }
      const formatted = formatTooltip(tooltip)
      expect(formatted).toBe('Tooltip text with link\n\nLearn more: https://example.com')
    })
  })
})
