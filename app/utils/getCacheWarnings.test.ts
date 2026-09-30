import { describe, it, expect } from 'vitest'

import { findIntendedDirective, getCacheWarnings } from './getCacheWarnings'

describe('findIntendedDirective', () => {
  it.each([
    ['maxage', 'max-age'],
    ['max_age', 'max-age'],
    ['s-max-age', 's-maxage'],
    ['smaxage', 's-maxage'],
    ['shared-max-age', 's-maxage'],
    ['swr', 'stale-while-revalidate'],
    ['stale_while_revalidate', 'stale-while-revalidate'],
    ['stale-while-revalidating', 'stale-while-revalidate'],
    ['stale-while-revaildate', 'stale-while-revalidate'],
    ['nocache', 'no-cache'],
    ['no-stroe', 'no-store'],
    ['must_revalidate', 'must-revalidate'],
    ['inmutable', 'immutable'],
    ['immutabel', 'immutable'],
  ])('maps %s to %s', (typo, intended) => {
    expect(findIntendedDirective(typo)).toBe(intended)
  })

  it.each(['durable', 'must-understand', 'Durable', 'public', 'fishiness', 'x-custom', 'pub'])(
    'does not correct %s',
    (directive) => {
      expect(findIntendedDirective(directive)).toBeUndefined()
    },
  )
})

describe('getCacheWarnings', () => {
  it('returns no warnings for a well-formed configuration', () => {
    const headers = new Headers({
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Debug-Netlify-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600, durable',
    })

    expect(getCacheWarnings(headers)).toEqual([])
  })

  it('returns no warnings when no cache-control headers are present', () => {
    expect(getCacheWarnings(new Headers({ ETag: '"abc"' }))).toEqual([])
  })

  it('flags stale-while-revalidate equal to max-age', () => {
    const headers = new Headers({
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
    })

    const warnings = getCacheWarnings(headers)

    expect(warnings).toHaveLength(1)
    expect(warnings[0]?.header).toBe('Cache-Control')
    expect(warnings[0]?.message).toContain('same value as max-age (60)')
    expect(warnings[0]?.url).toContain('stale-while-revalidate-directive')
  })

  it('flags stale-while-revalidate equal to s-maxage', () => {
    const headers = new Headers({
      'CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300',
    })

    const warnings = getCacheWarnings(headers)

    expect(warnings).toHaveLength(1)
    expect(warnings[0]?.header).toBe('CDN-Cache-Control')
    expect(warnings[0]?.message).toContain('same value as s-maxage (300)')
  })

  it('does not flag stale-while-revalidate=0 alongside max-age=0', () => {
    const headers = new Headers({
      'Cache-Control': 'public, max-age=0, stale-while-revalidate=0',
    })

    expect(getCacheWarnings(headers)).toEqual([])
  })

  it('does not flag differing stale-while-revalidate and max-age', () => {
    const headers = new Headers({
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
    })

    expect(getCacheWarnings(headers)).toEqual([])
  })

  it('flags directive typos with a suggestion, naming the user-facing header', () => {
    const headers = new Headers({
      'Debug-Netlify-CDN-Cache-Control': 'public, maxage=60, s-max-age=120',
    })

    const warnings = getCacheWarnings(headers)

    expect(warnings).toHaveLength(2)
    expect(warnings[0]?.header).toBe('Netlify-CDN-Cache-Control')
    expect(warnings[0]?.message).toContain('"maxage". Did you mean "max-age"?')
    expect(warnings[1]?.message).toContain('"s-max-age". Did you mean "s-maxage"?')
  })

  it('does not flag legitimate extension directives', () => {
    const headers = new Headers({
      'Cache-Control': 'public, max-age=60, durable, must-understand, fishiness=42',
    })

    expect(getCacheWarnings(headers)).toEqual([])
  })

  it('flags stale-while-revalidate combined with must-revalidate', () => {
    const headers = new Headers({
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=600, must-revalidate',
    })

    const warnings = getCacheWarnings(headers)

    expect(warnings).toHaveLength(1)
    expect(warnings[0]?.message).toContain('combines stale-while-revalidate with must-revalidate')
  })

  it('flags stale-while-revalidate without a freshness lifetime', () => {
    const headers = new Headers({
      'Cache-Control': 'public, stale-while-revalidate=600',
    })

    const warnings = getCacheWarnings(headers)

    expect(warnings).toHaveLength(1)
    expect(warnings[0]?.message).toContain('without max-age or s-maxage')
  })

  it('does not flag stale-while-revalidate without max-age when Expires provides a lifetime', () => {
    const headers = new Headers({
      'Cache-Control': 'public, stale-while-revalidate=600',
      Expires: 'Wed, 21 Oct 2015 08:28:00 GMT',
    })

    expect(getCacheWarnings(headers)).toEqual([])
  })

  it('reports warnings from every header independently', () => {
    const headers = new Headers({
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
      'CDN-Cache-Control': 'public, s-maxage=120, stale-while-revalidate=120',
    })

    const warnings = getCacheWarnings(headers)

    expect(warnings.map((w) => w.header)).toEqual(['Cache-Control', 'CDN-Cache-Control'])
  })
})
