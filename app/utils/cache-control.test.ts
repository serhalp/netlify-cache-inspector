import { describe, it, expect } from 'vitest'

import { parse, CacheControl } from './cache-control'

describe('parse', () => {
  it('parses basic cache control directives', () => {
    const result = parse('max-age=3600, public')

    expect(result.maxAge).toBe(3600)
    expect(result.public).toBe(true)
  })

  it('parses s-maxage directive', () => {
    const result = parse('s-maxage=7200')

    expect(result.sharedMaxAge).toBe(7200)
  })

  it('parses must-revalidate directive', () => {
    const result = parse('must-revalidate')

    expect(result.mustRevalidate).toBe(true)
  })

  it('parses immutable directive', () => {
    const result = parse('immutable')

    expect(result.immutable).toBe(true)
  })

  it('parses private directive', () => {
    const result = parse('private')

    expect(result.private).toBe(true)
  })

  it('parses no-store directive', () => {
    const result = parse('no-store')

    expect(result.noStore).toBe(true)
  })

  it('parses no-cache directive', () => {
    const result = parse('no-cache')

    expect(result.noCache).toBe(true)
  })

  it('handles empty header', () => {
    const result = parse('')

    expect(result.maxAge).toBe(null)
    expect(result.public).toBe(null)
  })

  it('handles null header', () => {
    const result = parse(null)

    expect(result.maxAge).toBe(null)
    expect(result.public).toBe(null)
  })

  it('handles undefined header', () => {
    const result = parse(undefined)

    expect(result.maxAge).toBe(null)
    expect(result.public).toBe(null)
  })
})

describe('CacheControl', () => {
  it('can be instantiated and used directly', () => {
    const cc = new CacheControl()
    const result = cc.parse('max-age=1800')

    expect(result.maxAge).toBe(1800)
  })

  it('handles extensions correctly', () => {
    const result = parse('max-age=3600, durable')

    expect(result.maxAge).toBe(3600)
    expect(result.extensions.durable).toBe(null)
  })
})
