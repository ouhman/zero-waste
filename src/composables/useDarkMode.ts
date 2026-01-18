import { ref, watch } from 'vue'

const isDark = ref(false)
let initialized = false

export function useDarkMode() {
  // Initialize from localStorage or default to light mode
  function init() {
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) {
      isDark.value = stored === 'true'
    } else {
      // Default to light mode (users can toggle to dark if preferred)
      isDark.value = false
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
