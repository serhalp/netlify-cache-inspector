import { describe, it, expect } from 'vitest'

import { parse, CacheControl } from './cache-control'

describe('parse', () => {
  it('parses max-age directive from cache control header', () => {
    const result = parse('max-age=3600')

    expect(result.maxAge).toBe(3600)
  })

  it('parses public directive from cache control header', () => {
    const result = parse('public')

    expect(result.public).toBe(true)
  })

  it('parses s-maxage directive from cache control header', () => {
    const result = parse('s-maxage=7200')

    expect(result.sharedMaxAge).toBe(7200)
  })

  it('parses must-revalidate directive from cache control header', () => {
    const result = parse('must-revalidate')

    expect(result.mustRevalidate).toBe(true)
  })

  it('parses immutable directive from cache control header', () => {
    const result = parse('immutable')

    expect(result.immutable).toBe(true)
  })

  it('parses private directive from cache control header', () => {
    const result = parse('private')

    expect(result.private).toBe(true)
  })

  it('parses no-store directive from cache control header', () => {
    const result = parse('no-store')

    expect(result.noStore).toBe(true)
  })

  it('parses no-cache directive from cache control header', () => {
    const result = parse('no-cache')

    expect(result.noCache).toBe(true)
  })

  it('returns null values when header is empty', () => {
    const result = parse('')

    expect(result.maxAge).toBe(null)
    expect(result.public).toBe(null)
  })

  it('returns null values when header is null', () => {
    const result = parse(null)

    expect(result.maxAge).toBe(null)
    expect(result.public).toBe(null)
  })

  it('returns null values when header is undefined', () => {
    const result = parse(undefined)

    expect(result.maxAge).toBe(null)
    expect(result.public).toBe(null)
  })

  it('can be instantiated and used directly', () => {
    const cc = new CacheControl()
    const result = cc.parse('max-age=1800')

    expect(result.maxAge).toBe(1800)
  })

  it('parses extension directives without values', () => {
    const result = parse('max-age=3600, durable')

    expect(result.maxAge).toBe(3600)
    expect(result.extensions.durable).toBe(null)
  })
})
