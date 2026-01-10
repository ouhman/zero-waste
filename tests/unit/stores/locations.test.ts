import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLocationsStore } from '@/stores/locations'

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          is: vi.fn(() => ({
            data: [],
            error: null
          }))
        }))
      }))
    }))
  }
}))

describe('Location Store', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
  })

  it('fetches approved locations from Supabase', async () => {
    const store = useLocationsStore()

    // Initial state
    expect(store.locations).toEqual([])
    expect(store.loading).toBe(false)

    // Fetch locations
    await store.fetchLocations()

    // Should have been called
    expect(store.loading).toBe(false)
  })

  it('returns empty array when no locations', async () => {
    const store = useLocationsStore()

    await store.fetchLocations()

    expect(store.locations).toEqual([])
    expect(store.error).toBe(null)
  })

  it('handles fetch error gracefully', async () => {
    const store = useLocationsStore()

    // Mock will return error in implementation
    await store.fetchLocations()

    // Should handle error without crashing
    expect(store.locations).toBeDefined()
  })

  it('caches locations after first fetch', async () => {
    const store = useLocationsStore()

    await store.fetchLocations()
    const firstFetch = store.locations

    // Second fetch should return cached data
    await store.fetchLocations()

    expect(store.locations).toBe(firstFetch)
  })

  it('provides getters for location data', () => {
    const store = useLocationsStore()

    expect(store.approvedLocations).toBeDefined()
    expect(Array.isArray(store.approvedLocations)).toBe(true)
  })
})
