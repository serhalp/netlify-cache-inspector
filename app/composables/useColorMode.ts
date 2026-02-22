type ColorMode = 'light' | 'dark' | 'system'

const colorMode = ref<ColorMode>('system')
const resolvedMode = ref<'light' | 'dark'>('light')

let mediaQuery: MediaQueryList | null = null

function applyMode(mode: 'light' | 'dark') {
  resolvedMode.value = mode
  if (import.meta.client) {
    document.documentElement.classList.toggle('dark', mode === 'dark')
  }
}

function resolveSystemMode(): 'light' | 'dark' {
  if (!import.meta.client) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function handleSystemChange(e: MediaQueryListEvent) {
  if (colorMode.value === 'system') {
    applyMode(e.matches ? 'dark' : 'light')
  }
}

export function useColorMode() {
  function setColorMode(mode: ColorMode) {
    colorMode.value = mode
    if (import.meta.client) {
      localStorage.setItem('color-mode', mode)
    }

    if (mode === 'system') {
      applyMode(resolveSystemMode())
    }
    else {
      applyMode(mode)
    }
  }

  if (import.meta.client) {
    onMounted(() => {
      const saved = localStorage.getItem('color-mode') as ColorMode | null
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        colorMode.value = saved
      }

      if (colorMode.value === 'system') {
        applyMode(resolveSystemMode())
      }
      else {
        applyMode(colorMode.value)
      }

      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', handleSystemChange)
    })

    onUnmounted(() => {
      mediaQuery?.removeEventListener('change', handleSystemChange)
    })
  }

  return {
    colorMode: readonly(colorMode),
    resolvedMode: readonly(resolvedMode),
    setColorMode,
  }
}
