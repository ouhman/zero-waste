import { ref, watch } from 'vue'

const isDark = ref(false)
let initialized = false

export function useDarkMode() {
  // Initialize from localStorage or system preference
  function init() {
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) {
      isDark.value = stored === 'true'
    } else {
      // Fall back to system preference
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme()
  }

  function applyTheme() {
    if (typeof document === 'undefined') return
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem('darkMode', String(isDark.value))
    applyTheme()
  }

  // Watch for changes (for reactive updates across components)
  watch(isDark, () => {
    applyTheme()
  })

  // Initialize once from localStorage/system preference
  if (typeof window !== 'undefined' && !initialized) {
    initialized = true
    init()
  }

  // Always ensure theme is applied (handles route navigation)
  applyTheme()

  return {
    isDark,
    toggle,
    init
  }
}
