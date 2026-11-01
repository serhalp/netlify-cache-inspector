import { describe, it, expect } from 'vitest'

import { getTimeToLive } from './getTimeToLive'

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

  it('returns the diff in seconds from `expiresAt` to `date` if `maxAge` and `age` are not defined and `expiresAt` and `date` are defined', () => {
    const age = undefined
    const date = new Date(1_000_000)
    const expiresAt = new Date(1_000_000 + 15_000)
    const maxAge = null
    const now = Date.now()

    expect(getTimeToLive(age, date, expiresAt, maxAge, now)).toBe(15)
  })

  it('ignores `now` when `date` and `expiresAt` are defined but `age` and `maxAge` are not', () => {
    const age = undefined
    const date = new Date(1_000_000)
    const expiresAt = new Date(1_000_000 + 15_000)
    const maxAge = null

    expect(getTimeToLive(age, date, expiresAt, maxAge, date.getTime())).toBe(15)
    expect(getTimeToLive(age, date, expiresAt, maxAge, expiresAt.getTime() + 86_400_000)).toBe(15)
  })

  it('returns the diff in seconds from `expiresAt` to `date` minus `age` if `age`, `date`, and `expiresAt` are defined but `maxAge` is not', () => {
    const age = 4
    const date = new Date(1_000_000)
    const expiresAt = new Date(1_000_000 + 15_000)
    const maxAge = null
    const now = Date.now()

    expect(getTimeToLive(age, date, expiresAt, maxAge, now)).toBe(11)
  })

  it('returns the diff in seconds from `expiresAt` to `now` if `maxAge`, `age`, and `date` are not defined and `expiresAt` is defined', () => {
    const age = undefined
    const date = undefined
    const expiresAt = new Date(1_000_000 + 15_000)
    const maxAge = null
    const now = new Date(1_000_000).getTime()

    expect(getTimeToLive(age, date, expiresAt, maxAge, now)).toBe(15)
  })

  it('prefers `maxAge` over `expiresAt` when both are defined', () => {
    const age = 10
    const date = new Date(1_000_000)
    const expiresAt = new Date(1_000_000 + 1_000_000)
    const maxAge = 25
    const now = date.getTime() + 10_000

    expect(getTimeToLive(age, date, expiresAt, maxAge, now)).toBe(15)
  })

  it('treats `maxAge` of `0` as defined', () => {
    const now = Date.now()

    expect(getTimeToLive(undefined, undefined, undefined, 0, now)).toBe(0)
    expect(getTimeToLive(0, new Date(1_000_000), undefined, 0, 1_010_000)).toBe(0)
  })

  it('treats `age` of `0` as defined', () => {
    expect(getTimeToLive(0, undefined, undefined, 25, Date.now())).toBe(25)
    expect(getTimeToLive(0, new Date(1_000_000), undefined, 25, 9_999_999)).toBe(25)
  })

  it('returns `undefined` if `maxAge` and `expiresAt` are not defined', () => {
    const age = 10
    const date = new Date()
    const expiresAt = undefined
    const maxAge = null
    const now = Date.now()

    expect(getTimeToLive(age, date, expiresAt, maxAge, now)).toBeUndefined()
  })

  it('returns `undefined` if no inputs are defined', () => {
    expect(getTimeToLive(undefined, undefined, undefined, null, Date.now())).toBeUndefined()
  })

  it('returns a negative TTL if `expiresAt` precedes `date`', () => {
    const age = undefined
    const date = new Date(1_000_000)
    const expiresAt = new Date(1_000_000 - 15_000)
    const maxAge = null
    const now = Date.now()

    expect(getTimeToLive(age, date, expiresAt, maxAge, now)).toBe(-15)
  })
})
