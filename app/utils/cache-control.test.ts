import { describe, it, expect } from 'vitest'

import { parse, CacheControl } from './cache-control'

describe('parse', () => {
  it('parses max-age directive from cache control header', () => {
    const result = parse('max-age=3600')

    expect(result.maxAge).toBe(3600)
  })

  it('parses public directive from cache control header', () => {
    expect(parse('public, max-age=5')).toHaveProperty('public', true)
    expect(parse('max-age=5, public')).toHaveProperty('public', true)
    expect(parse('max-age=5')).toHaveProperty('public', false)
  })

  it('parses s-maxage directive from cache control header', () => {
    const result = parse('s-maxage=7200')

    expect(result.sharedMaxAge).toBe(7200)
  })

  it('parses must-revalidate directive from cache control header', () => {
    expect(parse('public, must-revalidate')).toHaveProperty('mustRevalidate', true)
    expect(parse('must-revalidate, public')).toHaveProperty('mustRevalidate', true)
    expect(parse('max-age=5, public')).toHaveProperty('mustRevalidate', false)
  })

  it('parses immutable directive from cache control header', () => {
    expect(parse('public, immutable')).toHaveProperty('immutable', true)
    expect(parse('immutable, public')).toHaveProperty('immutable', true)
    expect(parse('max-age=5, public')).toHaveProperty('immutable', false)
  })

  it('parses private directive from cache control header', () => {
    expect(parse('max-age=5, private')).toHaveProperty('private', true)
    expect(parse('private, max-age=5')).toHaveProperty('private', true)
    expect(parse('max-age=5, public')).toHaveProperty('private', false)
  })

  it('parses no-store directive from cache control header', () => {
    expect(parse('max-age=5, no-store')).toHaveProperty('noStore', true)
    expect(parse('no-store, max-age=5')).toHaveProperty('noStore', true)
    expect(parse('max-age=5, public')).toHaveProperty('noStore', false)
  })

  it('parses no-cache directive from cache control header', () => {
    expect(parse('max-age=5, no-cache')).toHaveProperty('noCache', true)
    expect(parse('no-cache, max-age=5')).toHaveProperty('noCache', true)
    expect(parse('max-age=5, public')).toHaveProperty('noCache', false)
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
    expect(result.extensions).toHaveProperty('durable', null)
  })

  it('parses extension directives with values', () => {
    const result = parse('max-age=3600, fishiness=42')

    expect(result.maxAge).toBe(3600)
    expect(result.extensions).toHaveProperty('fishiness', '42')
  })
})
