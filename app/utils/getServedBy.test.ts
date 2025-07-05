import { describe, it, expect } from 'vitest'

import { getServedBy, ServedBySource, type ParsedCacheStatusEntry } from './getServedBy'

describe('getServedBy', () => {
  it('returns CdnEdge when Netlify Edge cache has a hit', () => {
    const headers = new Headers({
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

    expect(result.source).toBe(ServedBySource.CdnEdge)
    expect(result.cdnNodes).toBe('node1.example.com')
  })

  it('prioritizes CdnEdge hit over durable cache hit when both are present', () => {
    const headers = new Headers({
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

    expect(result.source).toBe(ServedBySource.CdnEdge)
  })

  it('returns DurableCache when Netlify Durable cache has a hit', () => {
    const headers = new Headers({
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

  it('returns Function when Debug-X-NF-Function-Type header is present', () => {
    const headers = new Headers({
      'Debug-X-NF-Function-Type': 'edge',
      'Debug-X-BB-Host-Id': 'node1.example.com',
    })
    const cacheStatus: ParsedCacheStatusEntry[] = []

    const result = getServedBy(headers, cacheStatus)

    expect(result.source).toBe(ServedBySource.Function)
  })

  it('prioritizes function over edge function when both headers are present', () => {
    const headers = new Headers({
      'Debug-X-NF-Function-Type': 'edge',
      'Debug-X-NF-Edge-Functions': 'middleware',
      'Debug-X-BB-Host-Id': 'node1.example.com',
    })
    const cacheStatus: ParsedCacheStatusEntry[] = []

    const result = getServedBy(headers, cacheStatus)

    expect(result.source).toBe(ServedBySource.Function)
  })

  it('returns EdgeFunction when Debug-X-NF-Edge-Functions header is present', () => {
    const headers = new Headers({
      'Debug-X-NF-Edge-Functions': 'middleware',
      'Debug-X-BB-Host-Id': 'node1.example.com',
    })
    const cacheStatus: ParsedCacheStatusEntry[] = []

    const result = getServedBy(headers, cacheStatus)

    expect(result.source).toBe(ServedBySource.EdgeFunction)
  })

  it('removes duplicate CDN nodes from Debug-X-BB-Host-Id header', () => {
    const headers = new Headers({
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
    const headers = new Headers({})
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

  it('returns CdnOrigin when no cache entries but CDN was involved', () => {
    const headers = new Headers({
      'Debug-X-BB-Host-Id': 'node1.example.com',
    })
    const cacheStatus: ParsedCacheStatusEntry[] = []

    const result = getServedBy(headers, cacheStatus)

    expect(result.source).toBe(ServedBySource.CdnOrigin)
    expect(result.cdnNodes).toBe('node1.example.com')
  })

  it('throws error when no serving source can be determined', () => {
    const headers = new Headers({})
    const cacheStatus: ParsedCacheStatusEntry[] = []

    expect(() => getServedBy(headers, cacheStatus)).toThrow(
      'Could not determine who served the request',
    )
  })

  it('returns CdnOrigin when Netlify Edge cache has a miss', () => {
    const headers = new Headers({
      'Debug-X-BB-Host-Id': 'node1.example.com',
    })
    const cacheStatus: ParsedCacheStatusEntry[] = [
      {
        cacheName: 'Netlify Edge',
        parameters: {
          hit: false,
          fwd: 'miss',
          stored: false,
          collapsed: false,
        },
      },
    ]

    const result = getServedBy(headers, cacheStatus)

    expect(result.source).toBe(ServedBySource.CdnOrigin)
    expect(result.cdnNodes).toBe('node1.example.com')
  })

  it('ignores cache entries without hits and picks first with hit', () => {
    const headers = new Headers({
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
