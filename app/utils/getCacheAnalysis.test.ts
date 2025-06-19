import { describe, it, expect } from 'vitest'

import getCacheAnalysis, { getTimeToLive, parseCacheStatus, ServedBySource } from './getCacheAnalysis'

describe('getCacheAnalysis', () => {
  it('returns basic cache analysis with minimal headers', () => {
    const headers = {
      'Cache-Status': '"Netlify Edge"; hit',
      'Debug-X-BB-Host-Id': 'node1.example.com',
    }
    const now = Date.now()

    const result = getCacheAnalysis(headers, now)

    expect(result).toMatchObject({
      servedBy: {
        source: ServedBySource.CDN,
        cdnNodes: 'node1.example.com',
      },
      cacheStatus: [
        {
          cacheName: 'Netlify Edge',
          parameters: {
            'hit': true,
            'fwd': undefined,
            'fwd-status': NaN,
            'ttl': NaN,
            'stored': false,
            'collapsed': false,
            'key': undefined,
            'detail': undefined,
          },
        },
      ],
      cacheControl: {
        isCacheable: true,
        age: undefined,
        date: undefined,
        etag: undefined,
        expiresAt: undefined,
        ttl: undefined,
        cdnTtl: undefined,
        netlifyCdnTtl: undefined,
        vary: undefined,
        netlifyVary: undefined,
        revalidate: undefined,
      },
    })
  })

  it('returns comprehensive cache analysis with all headers present', () => {
    const headers = {
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'CDN-Cache-Control': 's-maxage=7200',
      'Netlify-CDN-Cache-Control': 'max-age=14400',
      'Age': '1800',
      'Date': 'Wed, 21 Oct 2015 07:28:00 GMT',
      'Expires': 'Wed, 21 Oct 2015 08:28:00 GMT',
      'ETag': '"abc123"',
      'Vary': 'Accept-Encoding',
      'Netlify-Vary': 'Cookie',
      'Cache-Status': '"Next.js"; hit, "Netlify Durable"; stored, "Netlify Edge"; hit',
      'Debug-X-BB-Host-Id': 'node1.example.com, node2.example.com',
    }
    const now = new Date('Wed, 21 Oct 2015 07:28:00 GMT').getTime()

    const result = getCacheAnalysis(headers, now)

    expect(result.servedBy.source).toBe(ServedBySource.CDN)
    expect(result.servedBy.cdnNodes).toBe('node1.example.com, node2.example.com')
    expect(result.cacheStatus).toHaveLength(3)
    expect(result.cacheControl.isCacheable).toBe(true)
    expect(result.cacheControl.age).toBe(1800)
    expect(result.cacheControl.etag).toBe('"abc123"')
    expect(result.cacheControl.vary).toBe('Accept-Encoding')
    expect(result.cacheControl.netlifyVary).toBe('Cookie')
    expect(result.cacheControl.revalidate).toBe('must-revalidate')
  })

  it('handles empty headers gracefully', () => {
    const headers = {}
    const now = Date.now()

    expect(() => getCacheAnalysis(headers, now)).toThrow('Could not determine who served the request')
  })

  it('determines function serving when Debug-X-NF-Function-Type header is present', () => {
    const headers = {
      'Cache-Status': '',
      'Debug-X-NF-Function-Type': 'edge',
      'Debug-X-BB-Host-Id': 'node1.example.com',
    }
    const now = Date.now()

    const result = getCacheAnalysis(headers, now)

    expect(result.servedBy.source).toBe(ServedBySource.Function)
  })

  it('determines edge function serving when Debug-X-NF-Edge-Functions header is present', () => {
    const headers = {
      'Cache-Status': '',
      'Debug-X-NF-Edge-Functions': 'middleware',
      'Debug-X-BB-Host-Id': 'node1.example.com',
    }
    const now = Date.now()

    const result = getCacheAnalysis(headers, now)

    expect(result.servedBy.source).toBe(ServedBySource.EdgeFunction)
  })

  it('prioritizes function over edge function when both headers are present', () => {
    const headers = {
      'Cache-Status': '',
      'Debug-X-NF-Function-Type': 'edge',
      'Debug-X-NF-Edge-Functions': 'middleware',
      'Debug-X-BB-Host-Id': 'node1.example.com',
    }
    const now = Date.now()

    const result = getCacheAnalysis(headers, now)

    expect(result.servedBy.source).toBe(ServedBySource.Function)
  })

  it('determines cache as non-cacheable when private directive is present', () => {
    const headers = {
      'Cache-Control': 'private, max-age=3600',
      'Cache-Status': '"Netlify Edge"; hit',
      'Debug-X-BB-Host-Id': 'node1.example.com',
    }
    const now = Date.now()

    const result = getCacheAnalysis(headers, now)

    expect(result.cacheControl.isCacheable).toBe(false)
  })

  it('determines cache as non-cacheable when no-store directive is present', () => {
    const headers = {
      'Cache-Control': 'no-store',
      'Cache-Status': '"Netlify Edge"; hit',
      'Debug-X-BB-Host-Id': 'node1.example.com',
    }
    const now = Date.now()

    const result = getCacheAnalysis(headers, now)

    expect(result.cacheControl.isCacheable).toBe(false)
  })

  it('determines cache as non-cacheable when no-cache directive is present', () => {
    const headers = {
      'Cache-Control': 'no-cache',
      'Cache-Status': '"Netlify Edge"; hit',
      'Debug-X-BB-Host-Id': 'node1.example.com',
    }
    const now = Date.now()

    const result = getCacheAnalysis(headers, now)

    expect(result.cacheControl.isCacheable).toBe(false)
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
          'fwd-status': NaN,
          'ttl': NaN,
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

    // Should be sorted and then reversed
    expect(result[0]?.cacheName).toBe('Netlify Edge')
    expect(result[1]?.cacheName).toBe('Netlify Durable')
    expect(result[2]?.cacheName).toBe('Next.js')
  })

  it('handles forward parameter with different values', () => {
    const testCases = [
      { input: '"Cache"; fwd=bypass', expected: 'bypass' },
      { input: '"Cache"; fwd=method', expected: 'method' },
      { input: '"Cache"; fwd=uri-miss', expected: 'uri-miss' },
      { input: '"Cache"; fwd=vary-miss', expected: 'vary-miss' },
      { input: '"Cache"; fwd=miss', expected: 'miss' },
      { input: '"Cache"; fwd=request', expected: 'request' },
      { input: '"Cache"; fwd=stale', expected: 'stale' },
      { input: '"Cache"; fwd=partial', expected: 'partial' },
    ]

    testCases.forEach(({ input, expected }) => {
      const result = parseCacheStatus(input)
      expect(result[0]?.parameters.fwd).toBe(expected)
    })
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

// Test helper functions for internal functions since they're not exported
// We'll test them through the main functions where possible, but these are edge cases

describe('internal helper functions', () => {
  describe('fixDuplicatedCdnNodes (through getServedBy)', () => {
    it('removes duplicate CDN nodes from Debug-X-BB-Host-Id header', () => {
      const headers = {
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com, node1.example.com, node2.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.servedBy.cdnNodes).toBe('node1.example.com, node2.example.com')
    })

    it('preserves unique CDN nodes in Debug-X-BB-Host-Id header', () => {
      const headers = {
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com, node2.example.com, node3.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.servedBy.cdnNodes).toBe('node1.example.com, node2.example.com, node3.example.com')
    })

    it('handles single CDN node without duplicates', () => {
      const headers = {
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.servedBy.cdnNodes).toBe('node1.example.com')
    })

    it('uses fallback when Debug-X-BB-Host-Id header is missing', () => {
      const headers = {
        'Cache-Status': '"Netlify Edge"; hit',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.servedBy.cdnNodes).toBe('unknown CDN node')
    })
  })

  describe('TTL precedence order (through parseCacheControl)', () => {
    it('calculates CDN TTL with correct precedence order', () => {
      const headers = {
        'Cache-Control': 'max-age=1000',
        'CDN-Cache-Control': 's-maxage=2000, max-age=1500',
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
        'Age': '100',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      // Should use CDN-Cache-Control s-maxage first (2000 - 100 = 1900)
      expect(result.cacheControl.cdnTtl).toBe(1900)
    })

    it('falls back to CDN-Cache-Control max-age when s-maxage not present', () => {
      const headers = {
        'Cache-Control': 'max-age=1000',
        'CDN-Cache-Control': 'max-age=1500',
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
        'Age': '100',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      // Should use CDN-Cache-Control max-age (1500 - 100 = 1400)
      expect(result.cacheControl.cdnTtl).toBe(1400)
    })

    it('calculates Netlify CDN TTL with correct precedence order', () => {
      const headers = {
        'Cache-Control': 'max-age=1000',
        'CDN-Cache-Control': 's-maxage=2000',
        'Netlify-CDN-Cache-Control': 's-maxage=3000',
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
        'Age': '100',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      // Should use Netlify-CDN-Cache-Control s-maxage first (3000 - 100 = 2900)
      expect(result.cacheControl.netlifyCdnTtl).toBe(2900)
    })
  })

  describe('revalidate determination (through parseCacheControl)', () => {
    it('returns must-revalidate when must-revalidate directive is present', () => {
      const headers = {
        'Cache-Control': 'max-age=3600, must-revalidate',
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.cacheControl.revalidate).toBe('must-revalidate')
    })

    it('returns immutable when immutable directive is present', () => {
      const headers = {
        'Cache-Control': 'max-age=31536000, immutable',
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.cacheControl.revalidate).toBe('immutable')
    })

    it('prioritizes must-revalidate over immutable when both are present', () => {
      const headers = {
        'Cache-Control': 'max-age=3600, must-revalidate, immutable',
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.cacheControl.revalidate).toBe('must-revalidate')
    })

    it('returns undefined when neither must-revalidate nor immutable is present', () => {
      const headers = {
        'Cache-Control': 'max-age=3600',
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.cacheControl.revalidate).toBeUndefined()
    })
  })

  describe('served by source determination', () => {
    it('returns CDN when Netlify Edge cache has a hit', () => {
      const headers = {
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.servedBy.source).toBe(ServedBySource.CDN)
    })

    it('returns DurableCache when Netlify Durable cache has a hit', () => {
      const headers = {
        'Cache-Status': '"Netlify Durable"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.servedBy.source).toBe(ServedBySource.DurableCache)
    })

    it('prioritizes CDN hit over durable cache hit when both are present', () => {
      const headers = {
        'Cache-Status': '"Netlify Durable"; hit, "Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.servedBy.source).toBe(ServedBySource.CDN)
    })

    it('ignores cache entries without hits', () => {
      const headers = {
        'Cache-Status': '"Netlify Edge"; fwd=miss, "Netlify Durable"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.servedBy.source).toBe(ServedBySource.DurableCache)
    })
  })

  describe('cache control header parsing', () => {
    it('parses Age header correctly', () => {
      const headers = {
        'Age': '1800',
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.cacheControl.age).toBe(1800)
    })

    it('ignores empty Age header', () => {
      const headers = {
        'Age': '',
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.cacheControl.age).toBeUndefined()
    })

    it('parses Date header correctly', () => {
      const headers = {
        'Date': 'Wed, 21 Oct 2015 07:28:00 GMT',
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.cacheControl.date).toEqual(new Date('Wed, 21 Oct 2015 07:28:00 GMT'))
    })

    it('parses Expires header correctly', () => {
      const headers = {
        'Expires': 'Wed, 21 Oct 2015 08:28:00 GMT',
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.cacheControl.expiresAt).toEqual(new Date('Wed, 21 Oct 2015 08:28:00 GMT'))
    })

    it('extracts ETag header correctly', () => {
      const headers = {
        'ETag': '"abc123-def456"',
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.cacheControl.etag).toBe('"abc123-def456"')
    })

    it('extracts Vary header correctly', () => {
      const headers = {
        'Vary': 'Accept-Encoding, User-Agent',
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.cacheControl.vary).toBe('Accept-Encoding, User-Agent')
    })

    it('extracts Netlify-Vary header correctly', () => {
      const headers = {
        'Netlify-Vary': 'Cookie, Authorization',
        'Cache-Status': '"Netlify Edge"; hit',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      }
      const now = Date.now()

      const result = getCacheAnalysis(headers, now)

      expect(result.cacheControl.netlifyVary).toBe('Cookie, Authorization')
    })
  })
})
