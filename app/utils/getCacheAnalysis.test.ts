import { describe, it, expect } from 'vitest'

import { getTimeToLive } from './getCacheAnalysis'

describe('getCacheAnalysis', () => {
  it.todo('works')
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
