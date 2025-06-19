import { describe, it, expect } from 'vitest'

import { getServedBy, ServedBySource, type ParsedCacheStatusEntry } from './getCacheAnalysis'

describe('getServedBy', () => {
  const createMockHeaders = (headers: Record<string, string>): Headers => {
    return new Headers(headers)
  }

  describe('CDN serving', () => {
    it('returns CDN when Netlify Edge cache has a hit', () => {
      const headers = createMockHeaders({
        'Debug-X-BB-Host-Id': 'node1.example.com',
      })
      const cacheStatus: ParsedCacheStatusEntry[] = [
        {
          cacheName: 'Netlify Edge',
          parameters: {
            hit: true,
            stored: false,
            collapsed: false,
          },
        },
      ]

      const result = getServedBy(headers, cacheStatus)

      expect(result.source).toBe(ServedBySource.CDN)
      expect(result.cdnNodes).toBe('node1.example.com')
    })

    it('prioritizes CDN hit over durable cache hit when both are present', () => {
      const headers = createMockHeaders({
        'Debug-X-BB-Host-Id': 'node1.example.com',
      })
      const cacheStatus: ParsedCacheStatusEntry[] = [
        {
          cacheName: 'Netlify Edge',
          parameters: {
            hit: true,
            stored: false,
            collapsed: false,
          },
        },
        {
          cacheName: 'Netlify Durable',
          parameters: {
            hit: true,
            stored: false,
            collapsed: false,
          },
        },
      ]

      const result = getServedBy(headers, cacheStatus)

      expect(result.source).toBe(ServedBySource.CDN)
    })
  })

  describe('Durable Cache serving', () => {
    it('returns DurableCache when Netlify Durable cache has a hit', () => {
      const headers = createMockHeaders({
        'Debug-X-BB-Host-Id': 'node1.example.com',
      })
      const cacheStatus: ParsedCacheStatusEntry[] = [
        {
          cacheName: 'Netlify Durable',
          parameters: {
            hit: true,
            stored: false,
            collapsed: false,
          },
        },
      ]

      const result = getServedBy(headers, cacheStatus)

      expect(result.source).toBe(ServedBySource.DurableCache)
    })
  })

  describe('Function serving', () => {
    it('returns Function when Debug-X-NF-Function-Type header is present', () => {
      const headers = createMockHeaders({
        'Debug-X-NF-Function-Type': 'edge',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      })
      const cacheStatus: ParsedCacheStatusEntry[] = []

      const result = getServedBy(headers, cacheStatus)

      expect(result.source).toBe(ServedBySource.Function)
    })

    it('prioritizes function over edge function when both headers are present', () => {
      const headers = createMockHeaders({
        'Debug-X-NF-Function-Type': 'edge',
        'Debug-X-NF-Edge-Functions': 'middleware',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      })
      const cacheStatus: ParsedCacheStatusEntry[] = []

      const result = getServedBy(headers, cacheStatus)

      expect(result.source).toBe(ServedBySource.Function)
    })
  })

  describe('Edge Function serving', () => {
    it('returns EdgeFunction when Debug-X-NF-Edge-Functions header is present', () => {
      const headers = createMockHeaders({
        'Debug-X-NF-Edge-Functions': 'middleware',
        'Debug-X-BB-Host-Id': 'node1.example.com',
      })
      const cacheStatus: ParsedCacheStatusEntry[] = []

      const result = getServedBy(headers, cacheStatus)

      expect(result.source).toBe(ServedBySource.EdgeFunction)
    })
  })

  describe('CDN node handling', () => {
    it('removes duplicate CDN nodes from Debug-X-BB-Host-Id header', () => {
      const headers = createMockHeaders({
        'Debug-X-BB-Host-Id': 'node1.example.com, node1.example.com, node2.example.com',
      })
      const cacheStatus: ParsedCacheStatusEntry[] = [
        {
          cacheName: 'Netlify Edge',
          parameters: {
            hit: true,
            stored: false,
            collapsed: false,
          },
        },
      ]

      const result = getServedBy(headers, cacheStatus)

      expect(result.cdnNodes).toBe('node1.example.com, node2.example.com')
    })

    it('uses fallback when Debug-X-BB-Host-Id header is missing', () => {
      const headers = createMockHeaders({})
      const cacheStatus: ParsedCacheStatusEntry[] = [
        {
          cacheName: 'Netlify Edge',
          parameters: {
            hit: true,
            stored: false,
            collapsed: false,
          },
        },
      ]

      const result = getServedBy(headers, cacheStatus)

      expect(result.cdnNodes).toBe('unknown CDN node')
    })
  })

  describe('error handling', () => {
    it('throws error when no serving source can be determined', () => {
      const headers = createMockHeaders({})
      const cacheStatus: ParsedCacheStatusEntry[] = []

      expect(() => getServedBy(headers, cacheStatus)).toThrow(
        'Could not determine who served the request',
      )
    })

    it('ignores cache entries without hits', () => {
      const headers = createMockHeaders({
        'Debug-X-BB-Host-Id': 'node1.example.com',
      })
      const cacheStatus: ParsedCacheStatusEntry[] = [
        {
          cacheName: 'Netlify Edge',
          parameters: {
            hit: false,
            stored: false,
            collapsed: false,
          },
        },
        {
          cacheName: 'Netlify Durable',
          parameters: {
            hit: true,
            stored: false,
            collapsed: false,
          },
        },
      ]

      const result = getServedBy(headers, cacheStatus)

      expect(result.source).toBe(ServedBySource.DurableCache)
    })
  })
})
