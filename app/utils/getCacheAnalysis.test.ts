import { describe, it, expect } from 'vitest'

import getCacheAnalysis, { getTimeToLive, parseCacheStatus, ServedBySource } from './getCacheAnalysis'

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

describe('getTimeToLive', () => {
  it('returns the diff in seconds from `maxAge` to `age` if they are both defined', () => {
    const age = 10
    const date = undefined
    const expiresAt = undefined
    const maxAge = 25
    const now = Date.now()

    expect(getTimeToLive(age, date, expiresAt, maxAge, now)).toBe(15)
  })

  it('returns the diff in seconds from `maxAge` to `age` if they are both defined as well as `date`', () => {
    const age = 10
    const date = new Date(999_999_999)
    const expiresAt = undefined
    const maxAge = 25
    const now = Date.now()

    expect(getTimeToLive(age, date, expiresAt, maxAge, now)).toBe(15)
  })

  it('returns the diff in seconds from `maxAge` to `now - date` if `maxAge` and `date` are defined but not `age`', () => {
    const age = undefined
    const date = new Date(1_000_000)
    const expiresAt = undefined
    const maxAge = 25
    const now = new Date(1_000_000 + 10_000).getTime()

    expect(getTimeToLive(age, date, expiresAt, maxAge, now)).toBe(15)
  })

  it('returns the diff in seconds from `maxAge` to `now` if `maxAge` is defined but neither `age` nor `date`', () => {
    const age = undefined
    const date = undefined
    const expiresAt = undefined
    const maxAge = 25
    const now = new Date(1_000_000 + 10_000).getTime()

    expect(getTimeToLive(age, date, expiresAt, maxAge, now)).toBe(25)
  })

  it('returns the diff in seconds from `expiresAt` to `now - age` if `maxAge` and `date` are not defined and `expiresAt` and `age` are defined', () => {
    const age = 10
    const date = undefined
    const expiresAt = new Date(1_000_000 + 25_000)
    const maxAge = null
    const now = new Date(1_000_000 + 10_000).getTime()

    expect(getTimeToLive(age, date, expiresAt, maxAge, now)).toBe(15)
  })

  // FIXME(serhalp) Real bug. Fix logic. It's depending on `now` when given two absolute dates...
  it.fails(
    'returns the diff in seconds from `expiresAt` to `date` if `maxAge` and `age` are not defined and `expiresAt` and `date` are defined',
    () => {
      const age = undefined
      const date = new Date(1_000_000)
      const expiresAt = new Date(1_000_000 + 15_000)
      const maxAge = null
      const now = Date.now()

      expect(getTimeToLive(age, date, expiresAt, maxAge, now)).toBe(15)
    },
  )

  it('returns the diff in seconds from `expiresAt` to `now` if `maxAge`, `age`, and `date` are not defined and `expiresAt` is defined', () => {
    const age = undefined
    const date = undefined
    const expiresAt = new Date(1_000_000 + 15_000)
    const maxAge = null
    const now = new Date(1_000_000).getTime()

    expect(getTimeToLive(age, date, expiresAt, maxAge, now)).toBe(15)
  })

  it('returns `undefined` if `maxAge` and `expiresAt` are not defined', () => {
    const age = 10
    const date = new Date()
    const expiresAt = undefined
    const maxAge = null
    const now = Date.now()

    expect(getTimeToLive(age, date, expiresAt, maxAge, now)).toBeUndefined()
  })
})
