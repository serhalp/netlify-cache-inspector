/**
 * Composable for managing hover state across cache analysis data elements
 */
import { formatDuration, intervalToDuration } from 'date-fns'

interface HoverState {
  dataKey: string | null
  dataValue: string | null
  rawValue: unknown | null
}

const hoverState = ref<HoverState>({
  dataKey: null,
  dataValue: null,
  rawValue: null,
})

export const useDataHover = () => {
  const setHover = (dataKey: string | null, dataValue: string | null = null, rawValue: unknown = null) => {
    hoverState.value = { dataKey, dataValue, rawValue }
  }

  const clearHover = () => {
    hoverState.value = { dataKey: null, dataValue: null, rawValue: null }
  }

  const isKeyHovered = (key: string) => {
    return hoverState.value.dataKey === key
  }

  const isValueMatching = (rawValue: unknown) => {
    const hoveredRawValue = hoverState.value.rawValue

    // Handle Date comparison specially
    if (hoveredRawValue instanceof Date && rawValue instanceof Date) {
      return hoveredRawValue.getTime() === rawValue.getTime()
    }

    // For all other types, use direct equality
    return hoveredRawValue === rawValue
  }

  const getDelta = (currentRawValue: unknown): string | null => {
    const hoveredRawValue = hoverState.value.rawValue

    // Calculate delta for numbers
    if (typeof hoveredRawValue === 'number' && typeof currentRawValue === 'number') {
      const delta = currentRawValue - hoveredRawValue
      if (delta === 0) return null

      // Format delta with appropriate sign and unit
      const sign = delta > 0 ? '+' : ''
      return `${sign}${delta}s`
    }

    // Calculate delta for Dates
    if (hoveredRawValue instanceof Date && currentRawValue instanceof Date) {
      const deltaMs = currentRawValue.getTime() - hoveredRawValue.getTime()
      if (deltaMs === 0) return null

      const sign = deltaMs > 0 ? '+' : '-'
      const interval = intervalToDuration({
        start: hoveredRawValue,
        end: currentRawValue,
      })

      const humanDuration = formatDuration(interval)

      // If formatDuration returns empty string, fall back to milliseconds
      if (!humanDuration || humanDuration.trim() === '') {
        const absMs = Math.abs(deltaMs)
        if (absMs < 1000) {
          return `${sign}${absMs}ms`
        }
        else {
          return `${sign}${Math.round(absMs / 1000)}s`
        }
      }

      return `${sign}${humanDuration}`
    }

    return null
  }

  const getHoverState = computed(() => hoverState.value)

  return {
    setHover,
    clearHover,
    isKeyHovered,
    isValueMatching,
    getDelta,
    hoverState: getHoverState,
  }
}
