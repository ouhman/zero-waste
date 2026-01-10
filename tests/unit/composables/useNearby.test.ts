import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNearby } from '@/composables/useNearby'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn()
  }
}))

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn()
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
})

describe('useNearby', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls Supabase locations_nearby function', async () => {
    const mockNearbyLocations = [
      { id: '1', name: 'Nearby 1', slug: 'nearby-1', address: 'Address 1', latitude: '50.1109', longitude: '8.6821', distance_meters: 100 },
      { id: '2', name: 'Nearby 2', slug: 'nearby-2', address: 'Address 2', latitude: '50.1109', longitude: '8.6821', distance_meters: 200 }
    ]

    const mockSupabase = vi.mocked(supabase.rpc)
    mockSupabase.mockResolvedValue({ data: mockNearbyLocations, error: null } as any)

    const { findNearby, results } = useNearby()
    await findNearby(50.1109, 8.6821)

    expect(mockSupabase).toHaveBeenCalledWith('locations_nearby', { lat: 50.1109, lng: 8.6821, radius_meters: 5000 })
    expect(results.value).toHaveLength(2)
  })

  it('sorts by distance', async () => {
    const mockNearbyLocations = [
      { id: '2', name: 'Close', slug: 'close', address: 'Address 2', latitude: '50.1109', longitude: '8.6821', distance_meters: 100 },
      { id: '1', name: 'Far', slug: 'far', address: 'Address 1', latitude: '50.1109', longitude: '8.6821', distance_meters: 500 }
    ]

    const mockSupabase = vi.mocked(supabase.rpc)
    mockSupabase.mockResolvedValue({ data: mockNearbyLocations, error: null } as any)

    const { findNearby, results } = useNearby()
    await findNearby(50.1109, 8.6821)

    // Results should already be sorted by distance (PostGIS function handles this)
    expect(results.value[0].distance_meters).toBeLessThanOrEqual(results.value[1].distance_meters)
  })

  it('handles geolocation error', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({ code: 1, message: 'User denied geolocation', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 })
    })

    const { getUserLocation, error } = useNearby()
    await getUserLocation()

    expect(error.value).toBe('Location access denied')
  })

  it('gets user location successfully', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 50.1109,
          longitude: 8.6821,
          accuracy: 10
        }
      })
    })

    const { getUserLocation, userLat, userLng } = useNearby()
    await getUserLocation()

    expect(userLat.value).toBe(50.1109)
    expect(userLng.value).toBe(8.6821)
  })

  it('uses custom radius', async () => {
    const mockSupabase = vi.mocked(supabase.rpc)
    mockSupabase.mockResolvedValue({ data: [], error: null } as any)

    const { findNearby } = useNearby()
    await findNearby(50.1109, 8.6821, 1000)

    expect(mockSupabase).toHaveBeenCalledWith('locations_nearby', { lat: 50.1109, lng: 8.6821, radius_meters: 1000 })
  })

  it('handles empty results', async () => {
    const mockSupabase = vi.mocked(supabase.rpc)
    mockSupabase.mockResolvedValue({ data: [], error: null } as any)

    const { findNearby, results } = useNearby()
    await findNearby(50.1109, 8.6821)

    expect(results.value).toHaveLength(0)
  })
})
