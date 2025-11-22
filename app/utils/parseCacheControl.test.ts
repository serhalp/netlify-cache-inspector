import { describe, it, expect } from 'vitest'

import { parseCacheControl } from './parseCacheControl'

describe('parseCacheControl', () => {
  it('determines cache as cacheable by default', () => {
    const headers = new Headers({
      'Cache-Control': 'public, max-age=3600',
    })
    const now = Date.now()

    const result = parseCacheControl(headers, now)

    expect(result.isCacheable).toBe(true)
  })

  it('determines cache as non-cacheable when private directive is present', () => {
    const headers = new Headers({
      'Cache-Control': 'private, max-age=3600',
    })
    const now = Date.now()

    const result = parseCacheControl(headers, now)

    expect(result.isCacheable).toBe(false)
  })

  it('determines cache as non-cacheable when no-store directive is present', () => {
    const headers = new Headers({
      'Cache-Control': 'no-store',
    })
    const now = Date.now()

    const result = parseCacheControl(headers, now)

    expect(result.isCacheable).toBe(false)
  })

  it('determines cache as non-cacheable when no-cache directive is present', () => {
    const headers = new Headers({
      'Cache-Control': 'no-cache',
    })
    const now = Date.now()

    const result = parseCacheControl(headers, now)

    expect(result.isCacheable).toBe(false)
  })

  it('calculates CDN TTL with s-maxage precedence over max-age', () => {
    const headers = new Headers({
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
    const headers = new Headers({
      'Cache-Control': 'max-age=1000',
      'CDN-Cache-Control': 'max-age=1500',
      'Age': '100',
    })
    const now = Date.now()

    const result = parseCacheControl(headers, now)

    expect(result.cdnTtl).toBe(1400) // 1500 - 100
  })

  it('calculates Netlify CDN TTL with max-age when present', () => {
    const headers = new Headers({
      'Cache-Control': 'max-age=1000',
      'CDN-Cache-Control': 's-maxage=2000',
      'Debug-Netlify-CDN-Cache-Control': 'max-age=3000',
      'Age': '100',
    })
    const now = Date.now()

    const result = parseCacheControl(headers, now)

    expect(result.netlifyCdnTtl).toBe(2900) // 3000 - 100
  })

  it('returns must-revalidate when must-revalidate directive is present', () => {
    const headers = new Headers({
      'Cache-Control': 'max-age=3600, must-revalidate',
    })
    const now = Date.now()

    const result = parseCacheControl(headers, now)

    expect(result.revalidate).toBe('must-revalidate')
  })

  it('returns immutable when immutable directive is present', () => {
    const headers = new Headers({
      'Cache-Control': 'max-age=3600, immutable',
    })
    const now = Date.now()

    const result = parseCacheControl(headers, now)

    expect(result.revalidate).toBe('immutable')
  })

  it('prioritizes must-revalidate over immutable when both are present', () => {
    const headers = new Headers({
      'Cache-Control': 'max-age=3600, must-revalidate, immutable',
    })
    const now = Date.now()

    const result = parseCacheControl(headers, now)

    expect(result.revalidate).toBe('must-revalidate')
  })

  it('returns undefined when neither must-revalidate nor immutable is present', () => {
    const headers = new Headers({
      'Cache-Control': 'max-age=3600',
    })
    const now = Date.now()

    const result = parseCacheControl(headers, now)

    expect(result.revalidate).toBeUndefined()
  })

  it('parses Age header when value is present', () => {
    const headers = new Headers({
      Age: '1800',
    })
    const now = Date.now()

    const result = parseCacheControl(headers, now)

    expect(result.age).toBe(1800)
  })

  it('ignores empty Age header', () => {
    const headers = new Headers({
      Age: '',
    })
    const now = Date.now()

    const result = parseCacheControl(headers, now)

    expect(result.age).toBeUndefined()
  })

  it('parses Date header when present', () => {
    const headers = new Headers({
      Date: 'Wed, 21 Oct 2015 07:28:00 GMT',
    })
    const now = Date.now()

    const result = parseCacheControl(headers, now)

    expect(result.date).toEqual(new Date('Wed, 21 Oct 2015 07:28:00 GMT'))
  })

  it('parses Expires header when present', () => {
    const headers = new Headers({
      Expires: 'Wed, 21 Oct 2015 08:28:00 GMT',
    })
    const now = Date.now()

    const result = parseCacheControl(headers, now)

    expect(result.expiresAt).toEqual(new Date('Wed, 21 Oct 2015 08:28:00 GMT'))
  })

  it('extracts ETag header when present', () => {
    const headers = new Headers({
      ETag: '"abc123-def456"',
    })
    const now = Date.now()

    const result = parseCacheControl(headers, now)

    expect(result.etag).toBe('"abc123-def456"')
  })

  it('extracts Vary header when present', () => {
    const headers = new Headers({
      Vary: 'Accept-Encoding, User-Agent',
    })
    const now = Date.now()

    const result = parseCacheControl(headers, now)

    expect(result.vary).toBe('Accept-Encoding, User-Agent')
  })

  it('extracts Netlify-Vary header when present', () => {
    const headers = new Headers({
      'Netlify-Vary': 'Cookie, Authorization',
    })
    const now = Date.now()

    const result = parseCacheControl(headers, now)

    expect(result.netlifyVary).toBe('Cookie, Authorization')
  })
})
