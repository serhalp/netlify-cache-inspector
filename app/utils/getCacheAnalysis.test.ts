import { describe, it, expect } from 'vitest'

import getCacheAnalysis, { parseCacheStatus } from './getCacheAnalysis'
import { ServedBySource } from './getServedBy'

describe('getCacheAnalysis', () => {
  it('returns cache analysis structure with basic CDN headers', () => {
    const headers = {
      'Cache-Status': '"Netlify Edge"; hit',
      'Debug-X-BB-Host-Id': 'node1.example.com',
    }
    const now = Date.now()

    const result = getCacheAnalysis(headers, now)

    expect(result).toHaveProperty('servedBy')
    expect(result).toHaveProperty('cacheStatus')
    expect(result).toHaveProperty('cacheControl')
    expect(result.servedBy.source).toBe(ServedBySource.CDN)
  })

  it('integrates Cache-Status parsing correctly', () => {
    const headers = {
      'Cache-Status': '"Next.js"; hit, "Netlify Edge"; hit',
      'Debug-X-BB-Host-Id': 'node1.example.com',
    }
    const now = Date.now()

    const result = getCacheAnalysis(headers, now)

    expect(result.cacheStatus).toHaveLength(2)
    expect(result.cacheStatus[0]?.cacheName).toBe('Netlify Edge')
    expect(result.cacheStatus[1]?.cacheName).toBe('Next.js')
  })

  it('integrates cache control parsing correctly', () => {
    const headers = {
      'Cache-Control': 'max-age=3600',
      'Cache-Status': '"Netlify Edge"; hit',
      'Debug-X-BB-Host-Id': 'node1.example.com',
    }
    const now = Date.now()

    const result = getCacheAnalysis(headers, now)

    expect(result.cacheControl.isCacheable).toBe(true)
    expect(typeof result.cacheControl.ttl).toBe('number')
  })

  it('integrates served by determination correctly', () => {
    const headers = {
      'Cache-Status': '"Netlify Durable"; hit',
      'Debug-X-BB-Host-Id': 'node1.example.com',
    }
    const now = Date.now()

    const result = getCacheAnalysis(headers, now)

    expect(result.servedBy.source).toBe(ServedBySource.DurableCache)
    expect(result.servedBy.cdnNodes).toBe('node1.example.com')
  })

  it('handles empty headers gracefully', () => {
    const headers = {}
    const now = Date.now()

    expect(() => getCacheAnalysis(headers, now)).toThrow('Could not determine who served the request')
  })
})

describe('parseCacheStatus', () => {
  it('parses single cache status entry with hit parameter', () => {
    const cacheStatus = '"Netlify Edge"; hit'

    const result = parseCacheStatus(cacheStatus)

    expect(result).toEqual([
      {
        cacheName: 'Netlify Edge',
        parameters: {
          'hit': true,
          'fwd': undefined,
          'fwd-status': undefined,
          'ttl': undefined,
          'stored': false,
          'collapsed': false,
          'key': undefined,
          'detail': undefined,
        },
      },
    ])
  })

  it('parses multiple cache status entries with different parameters', () => {
    const cacheStatus = '"Next.js"; hit, "Netlify Durable"; fwd=miss; stored, "Netlify Edge"; fwd=miss'

    const result = parseCacheStatus(cacheStatus)

    expect(result).toHaveLength(3)
    expect(result[0]?.cacheName).toBe('Netlify Edge') // Should be reversed per spec
    expect(result[1]?.cacheName).toBe('Netlify Durable')
    expect(result[2]?.cacheName).toBe('Next.js')
    expect(result[0]?.parameters.fwd).toBe('miss')
    expect(result[1]?.parameters.stored).toBe(true)
    expect(result[2]?.parameters.hit).toBe(true)
  })

  it('parses cache status with numeric parameters', () => {
    const cacheStatus = '"Netlify Edge"; hit; fwd-status=200; ttl=3600'

    const result = parseCacheStatus(cacheStatus)

    expect(result[0]?.parameters['fwd-status']).toBe(200)
    expect(result[0]?.parameters.ttl).toBe(3600)
  })

  it('parses cache status with string parameters', () => {
    const cacheStatus = '"Netlify Edge"; hit; key=cache-key-123; detail=some-detail'

    const result = parseCacheStatus(cacheStatus)

    expect(result[0]?.parameters.key).toBe('cache-key-123')
    expect(result[0]?.parameters.detail).toBe('some-detail')
  })

  it('handles empty cache status string', () => {
    const result = parseCacheStatus('')

    expect(result).toEqual([])
  })

  it('ignores invalid cache status entries without parameters', () => {
    const cacheStatus = '"Netlify Edge", "Valid Cache"; hit'

    const result = parseCacheStatus(cacheStatus)

    expect(result).toHaveLength(1)
    expect(result[0]?.cacheName).toBe('Valid Cache')
  })

  it('ignores cache status entries with invalid parameters', () => {
    const cacheStatus = '"Netlify Edge"; ; hit'

    const result = parseCacheStatus(cacheStatus)

    expect(result).toHaveLength(1)
    expect(result[0]?.cacheName).toBe('Netlify Edge')
    expect(result[0]?.parameters.hit).toBe(true)
  })

  it('sorts cache entries according to RFC 9211 precedence', () => {
    const cacheStatus = '"Netlify Edge"; hit, "Next.js"; hit, "Netlify Durable"; hit'

    const result = parseCacheStatus(cacheStatus)

    expect(result[0]?.cacheName).toBe('Netlify Edge')
    expect(result[1]?.cacheName).toBe('Netlify Durable')
    expect(result[2]?.cacheName).toBe('Next.js')
  })

  it('parses forward parameter values from cache status entries', () => {
    const result = parseCacheStatus('"Cache"; fwd=bypass')
    expect(result[0]?.parameters.fwd).toBe('bypass')
  })
})
