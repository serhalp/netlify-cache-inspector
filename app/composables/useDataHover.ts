/**
 * Composable for managing hover state across cache analysis data elements
 */

interface HoverState {
  dataKey: string | null
  dataValue: string | null
}

const hoverState = ref<HoverState>({
  dataKey: null,
  dataValue: null,
})

export const useDataHover = () => {
  const setHover = (dataKey: string | null, dataValue: string | null = null) => {
    hoverState.value = { dataKey, dataValue }
  }

  const clearHover = () => {
    hoverState.value = { dataKey: null, dataValue: null }
  }

  const isKeyHovered = (key: string) => {
    return hoverState.value.dataKey === key
  }

  const isValueMatching = (value: string) => {
    return hoverState.value.dataValue === value
  }

  const getHoverState = computed(() => hoverState.value)

  return {
    setHover,
    clearHover,
    isKeyHovered,
    isValueMatching,
    hoverState: getHoverState,
  }
}
