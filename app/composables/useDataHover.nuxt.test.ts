/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { useDataHover } from './useDataHover'

describe('useDataHover', () => {
  it('should initialize with null hover state', () => {
    const { hoverState } = useDataHover()
    expect(hoverState.value.dataKey).toBe(null)
    expect(hoverState.value.dataValue).toBe(null)
    expect(hoverState.value.rawValue).toBe(null)
  })

  it('should set hover state with data key and value', () => {
    const { setHover, hoverState } = useDataHover()
    setHover('Age', '5s', 5)
    expect(hoverState.value.dataKey).toBe('Age')
    expect(hoverState.value.dataValue).toBe('5s')
    expect(hoverState.value.rawValue).toBe(5)
  })

  it('should clear hover state', () => {
    const { setHover, clearHover, hoverState } = useDataHover()
    setHover('Hit', '✅', true)
    clearHover()
    expect(hoverState.value.dataKey).toBe(null)
    expect(hoverState.value.dataValue).toBe(null)
    expect(hoverState.value.rawValue).toBe(null)
  })

  it('should identify hovered keys', () => {
    const { setHover, isKeyHovered } = useDataHover()
    setHover('Cacheable', '✅')
    expect(isKeyHovered('Cacheable')).toBe(true)
    expect(isKeyHovered('Age')).toBe(false)
  })

  it('should match raw values for comparison', () => {
    const { setHover, isValueMatching } = useDataHover()
    setHover('TTL', '10s', 10)
    expect(isValueMatching(10)).toBe(true)
    expect(isValueMatching(5)).toBe(false)
  })

  it('should maintain shared state across multiple instances', () => {
    const instance1 = useDataHover()
    const instance2 = useDataHover()

    instance1.setHover('Hit', '✅', true)

    expect(instance2.isKeyHovered('Hit')).toBe(true)
    expect(instance2.isValueMatching(true)).toBe(true)
  })

  it('should calculate positive delta for numbers', () => {
    const { setHover, getDelta } = useDataHover()
    setHover('TTL', '5s', 5)
    expect(getDelta(8)).toBe('+3s')
  })

  it('should calculate negative delta for numbers', () => {
    const { setHover, getDelta } = useDataHover()
    setHover('TTL', '10s', 10)
    expect(getDelta(7)).toBe('-3s')
  })

  it('should return null for equal numbers', () => {
    const { setHover, getDelta } = useDataHover()
    setHover('TTL', '5s', 5)
    expect(getDelta(5)).toBe(null)
  })

  it('should return null for non-numeric values', () => {
    const { setHover, getDelta } = useDataHover()
    setHover('Hit', '✅', true)
    expect(getDelta(false)).toBe(null)
  })

  it('should return null when hover value is not numeric', () => {
    const { setHover, getDelta } = useDataHover()
    setHover('Hit', '✅', true)
    expect(getDelta(5)).toBe(null)
  })

  it('should return true if both values are Dates with the same epoch value', () => {
    const { setHover, isValueMatching } = useDataHover()
    const date1 = new Date('2023-01-01T00:00:00Z')
    const date2 = new Date('2023-01-01T00:00:00Z')
    const date3 = new Date('2023-01-02T00:00:00Z')

    setHover('Date', 'Jan 1, 2023', date1)
    expect(isValueMatching(date2)).toBe(true)
    expect(isValueMatching(date3)).toBe(false)
  })

  it('should calculate positive delta for Dates', () => {
    const { setHover, getDelta } = useDataHover()
    const date1 = new Date('2023-01-01T00:00:00Z')
    const date2 = new Date('2023-01-01T00:01:00Z') // 1 minute later

    setHover('Date', 'Jan 1, 2023', date1)
    const delta = getDelta(date2)
    expect(delta).toContain('+')
    expect(delta).toContain('minute')
  })

  it('should calculate negative delta for Dates', () => {
    const { setHover, getDelta } = useDataHover()
    const date1 = new Date('2023-01-01T00:01:00Z')
    const date2 = new Date('2023-01-01T00:00:00Z') // 1 minute earlier

    setHover('Date', 'Jan 1, 2023', date1)
    const delta = getDelta(date2)
    expect(delta).toContain('-')
    expect(delta).toContain('minute')
  })

  it('should return null for equal Dates', () => {
    const { setHover, getDelta } = useDataHover()
    const date1 = new Date('2023-01-01T00:00:00Z')
    const date2 = new Date('2023-01-01T00:00:00Z')

    setHover('Date', 'Jan 1, 2023', date1)
    expect(getDelta(date2)).toBe(null)
  })
})
