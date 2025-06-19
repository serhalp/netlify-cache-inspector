import { describe, it, expect } from 'vitest'

import { parseCacheControl } from './getCacheAnalysis'

describe('parseCacheControl', () => {
  const createMockHeaders = (headers: Record<string, string>): Headers => {
    return new Headers(headers)
  }

  describe('cache control directives', () => {
    it('determines cache as cacheable by default', () => {
      const headers = createMockHeaders({
        'Cache-Control': 'public, max-age=3600',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(result.isCacheable).toBe(true)
    })

    it('determines cache as non-cacheable when private directive is present', () => {
      const headers = createMockHeaders({
        'Cache-Control': 'private, max-age=3600',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(result.isCacheable).toBe(false)
    })

    it('determines cache as non-cacheable when no-store directive is present', () => {
      const headers = createMockHeaders({
        'Cache-Control': 'no-store',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(result.isCacheable).toBe(false)
    })

    it('determines cache as non-cacheable when no-cache directive is present', () => {
      const headers = createMockHeaders({
        'Cache-Control': 'no-cache',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(result.isCacheable).toBe(false)
    })
  })

  describe('TTL calculation', () => {
    it('calculates CDN TTL with correct precedence order', () => {
      const headers = createMockHeaders({
        'Cache-Control': 'max-age=1000',
        'CDN-Cache-Control': 's-maxage=2000, max-age=1500',
        'Age': '100',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(typeof result.cdnTtl).toBe('number')
      expect(result.cdnTtl).toBe(1900) // 2000 - 100
    })

    it('falls back to CDN-Cache-Control max-age when s-maxage not present', () => {
      const headers = createMockHeaders({
        'Cache-Control': 'max-age=1000',
        'CDN-Cache-Control': 'max-age=1500',
        'Age': '100',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(result.cdnTtl).toBe(1400) // 1500 - 100
    })

    it('calculates Netlify CDN TTL with correct precedence order', () => {
      const headers = createMockHeaders({
        'Cache-Control': 'max-age=1000',
        'CDN-Cache-Control': 's-maxage=2000',
        'Netlify-CDN-Cache-Control': 'max-age=3000',
        'Age': '100',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(result.netlifyCdnTtl).toBe(2900) // 3000 - 100
    })
  })

  describe('revalidate determination', () => {
    it('returns must-revalidate when must-revalidate directive is present', () => {
      const headers = createMockHeaders({
        'Cache-Control': 'max-age=3600, must-revalidate',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(result.revalidate).toBe('must-revalidate')
    })

    it('returns immutable when immutable directive is present', () => {
      const headers = createMockHeaders({
        'Cache-Control': 'max-age=3600, immutable',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(result.revalidate).toBe('immutable')
    })

    it('prioritizes must-revalidate over immutable when both are present', () => {
      const headers = createMockHeaders({
        'Cache-Control': 'max-age=3600, must-revalidate, immutable',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(result.revalidate).toBe('must-revalidate')
    })

    it('returns undefined when neither must-revalidate nor immutable is present', () => {
      const headers = createMockHeaders({
        'Cache-Control': 'max-age=3600',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(result.revalidate).toBeUndefined()
    })
  })

  describe('header parsing', () => {
    it('parses Age header correctly', () => {
      const headers = createMockHeaders({
        Age: '1800',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(result.age).toBe(1800)
    })

    it('ignores empty Age header', () => {
      const headers = createMockHeaders({
        Age: '',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(result.age).toBeUndefined()
    })

    it('parses Date header correctly', () => {
      const headers = createMockHeaders({
        Date: 'Wed, 21 Oct 2015 07:28:00 GMT',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(result.date).toEqual(new Date('Wed, 21 Oct 2015 07:28:00 GMT'))
    })

    it('parses Expires header correctly', () => {
      const headers = createMockHeaders({
        Expires: 'Wed, 21 Oct 2015 08:28:00 GMT',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(result.expiresAt).toEqual(new Date('Wed, 21 Oct 2015 08:28:00 GMT'))
    })

    it('extracts ETag header correctly', () => {
      const headers = createMockHeaders({
        ETag: '"abc123-def456"',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(result.etag).toBe('"abc123-def456"')
    })

    it('extracts Vary header correctly', () => {
      const headers = createMockHeaders({
        Vary: 'Accept-Encoding, User-Agent',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(result.vary).toBe('Accept-Encoding, User-Agent')
    })

    it('extracts Netlify-Vary header correctly', () => {
      const headers = createMockHeaders({
        'Netlify-Vary': 'Cookie, Authorization',
      })
      const now = Date.now()

      const result = parseCacheControl(headers, now)

      expect(result.netlifyVary).toBe('Cookie, Authorization')
    })
  })
})
