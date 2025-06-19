/**
 * Composable for managing hover state across cache analysis data elements
 */

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

  const isValueMatching = (value: string) => {
    return hoverState.value.dataValue === value
  }

  const getDelta = (currentRawValue: unknown): string | null => {
    const hoveredRawValue = hoverState.value.rawValue

    // Only calculate delta for numbers
    if (typeof hoveredRawValue === 'number' && typeof currentRawValue === 'number') {
      const delta = currentRawValue - hoveredRawValue
      if (delta === 0) return null

      // Format delta with appropriate sign and unit
      const sign = delta > 0 ? '+' : ''
      return `${sign}${delta}s`
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
