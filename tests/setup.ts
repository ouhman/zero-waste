/**
 * Global test setup file
 * This runs before all tests to set up the test environment
 */
import { beforeEach } from 'vitest'

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
