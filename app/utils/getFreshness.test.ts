import { describe, it, expect } from 'vitest'

import { getFreshness } from './getFreshness'

describe('getFreshness', () => {
  it('returns `undefined` when there is no TTL to base freshness on', () => {
    expect(getFreshness(undefined, 600)).toBeUndefined()
  })

  it('returns fresh while the TTL has not elapsed', () => {
    expect(getFreshness(15, 600)).toEqual({ state: 'fresh' })
  })

  it('returns fresh while the TTL has not elapsed even without stale-while-revalidate', () => {
    expect(getFreshness(15, undefined)).toEqual({ state: 'fresh' })
  })

  it('returns stale-while-revalidate with the remaining window once the TTL has elapsed', () => {
    expect(getFreshness(-40, 600)).toEqual({
      state: 'stale-while-revalidate',
      staleWhileRevalidateTtl: 560,
    })
  })

  it('returns stale-while-revalidate with the full window when the TTL has just elapsed', () => {
    expect(getFreshness(0, 600)).toEqual({
      state: 'stale-while-revalidate',
      staleWhileRevalidateTtl: 600,
    })
  })

  it('returns stale once the stale-while-revalidate window has also elapsed', () => {
    expect(getFreshness(-600, 600)).toEqual({ state: 'stale' })
  })

  it('returns stale once the TTL has elapsed and there is no stale-while-revalidate', () => {
    expect(getFreshness(-1, undefined)).toEqual({ state: 'stale' })
  })

  it('returns stale when stale-while-revalidate is zero', () => {
    expect(getFreshness(0, 0)).toEqual({ state: 'stale' })
  })
})
