import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useFavorites, _resetFavoritesState } from '@/composables/useFavorites'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => {
      return store[key] || null
    },
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})

describe('useFavorites', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear()
    vi.clearAllMocks()
    // Reset the favorites state
    _resetFavoritesState()
  })

  afterEach(() => {
    // Reset any shared state between tests
    localStorageMock.clear()
    _resetFavoritesState()
  })

  it('initializes with empty favorites', () => {
    const { favorites } = useFavorites()
    expect(favorites.value).toHaveLength(0)
  })

  it('adds location to favorites', () => {
    const { addFavorite, favorites, isFavorite } = useFavorites()

    addFavorite('location-1')

    expect(favorites.value).toContain('location-1')
    expect(isFavorite('location-1')).toBe(true)
    expect(favorites.value).toHaveLength(1)
  })

  it('removes location from favorites', () => {
    const { addFavorite, removeFavorite, favorites, isFavorite } = useFavorites()

    addFavorite('location-1')
    expect(favorites.value).toContain('location-1')

    removeFavorite('location-1')

    expect(favorites.value).not.toContain('location-1')
    expect(isFavorite('location-1')).toBe(false)
    expect(favorites.value).toHaveLength(0)
  })

  it('toggles favorite status', () => {
    const { toggleFavorite, isFavorite } = useFavorites()

    // Add favorite
    toggleFavorite('location-1')
    expect(isFavorite('location-1')).toBe(true)

    // Remove favorite
    toggleFavorite('location-1')
    expect(isFavorite('location-1')).toBe(false)
  })

  it('persists to localStorage', async () => {
    const { addFavorite } = useFavorites()

    addFavorite('location-1')
    addFavorite('location-2')

    // Wait for the watch to trigger and persist to localStorage
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check localStorage
    const stored = localStorage.getItem('zerowaste-favorites')
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed).toEqual(['location-1', 'location-2'])
  })

  it('loads from localStorage on init', () => {
    // Pre-populate localStorage
    localStorage.setItem('zerowaste-favorites', JSON.stringify(['location-1', 'location-2']))

    const { favorites, isFavorite } = useFavorites()

    expect(favorites.value).toHaveLength(2)
    expect(isFavorite('location-1')).toBe(true)
    expect(isFavorite('location-2')).toBe(true)
  })

  it('returns isFavorite(id) boolean', () => {
    const { addFavorite, isFavorite } = useFavorites()

    expect(isFavorite('location-1')).toBe(false)

    addFavorite('location-1')

    expect(isFavorite('location-1')).toBe(true)
    expect(isFavorite('location-2')).toBe(false)
  })

  it('handles invalid localStorage data gracefully', () => {
    // Set invalid JSON
    localStorage.setItem('zerowaste-favorites', 'invalid-json')

    const { favorites } = useFavorites()

    // Should initialize with empty array
    expect(favorites.value).toHaveLength(0)
  })

  it('prevents duplicate favorites', () => {
    const { addFavorite, favorites } = useFavorites()

    addFavorite('location-1')
    addFavorite('location-1')
    addFavorite('location-1')

    expect(favorites.value).toHaveLength(1)
    expect(favorites.value).toEqual(['location-1'])
  })
})
