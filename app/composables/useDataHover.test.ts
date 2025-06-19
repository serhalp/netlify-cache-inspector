/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { useDataHover } from '../composables/useDataHover'

describe('useDataHover', () => {
  it('should initialize with null hover state', () => {
    const { hoverState } = useDataHover()
    expect(hoverState.value.dataKey).toBe(null)
    expect(hoverState.value.dataValue).toBe(null)
  })

  it('should set hover state correctly', () => {
    const { setHover, hoverState } = useDataHover()
    setHover('Age', '5s')
    expect(hoverState.value.dataKey).toBe('Age')
    expect(hoverState.value.dataValue).toBe('5s')
  })

  it('should clear hover state', () => {
    const { setHover, clearHover, hoverState } = useDataHover()
    setHover('Hit', '✅')
    clearHover()
    expect(hoverState.value.dataKey).toBe(null)
    expect(hoverState.value.dataValue).toBe(null)
  })

  it('should correctly identify hovered keys', () => {
    const { setHover, isKeyHovered } = useDataHover()
    setHover('Cacheable', '✅')
    expect(isKeyHovered('Cacheable')).toBe(true)
    expect(isKeyHovered('Age')).toBe(false)
  })

  it('should correctly match values', () => {
    const { setHover, isValueMatching } = useDataHover()
    setHover('TTL', '10s')
    expect(isValueMatching('10s')).toBe(true)
    expect(isValueMatching('5s')).toBe(false)
  })

  it('should handle shared state across multiple instances', () => {
    const instance1 = useDataHover()
    const instance2 = useDataHover()
    
    instance1.setHover('Hit', '✅')
    
    expect(instance2.isKeyHovered('Hit')).toBe(true)
    expect(instance2.isValueMatching('✅')).toBe(true)
  })
})