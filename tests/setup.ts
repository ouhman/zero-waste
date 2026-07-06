/**
 * Global test setup file
 * This runs before all tests to set up the test environment
 */
import { afterEach, beforeEach } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

// Unmount every component mounted via @vue/test-utils after each test. Leaked
// components keep reactive effects (and timers) alive past the test; when they
// re-render after vitest tears down the jsdom `window`, vue-i18n's dev-mode
// `t()` path dereferences the now-undefined `window` and throws
// "window is not defined". Auto-unmounting stops those effects before teardown.
enableAutoUnmount(afterEach)

// Create localStorage mock that works with jsdom
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] ?? null
  }
})()

// Override localStorage globally
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Ensure localStorage is cleared between test files
beforeEach(() => {
  localStorageMock.clear()
})
