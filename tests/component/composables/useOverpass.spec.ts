import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useOverpass } from '@/composables/useOverpass'

describe('useOverpass', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct default values', () => {
    const { loading, error, pois } = useOverpass()
    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
    expect(pois.value).toEqual([])
  })

  it('should fetch nearby POIs successfully', async () => {
    const mockResponse = {
      elements: [
        {
          type: 'node',
          id: 123,
          lat: 50.1109,
          lon: 8.6821,
          tags: {
            name: 'Test Cafe',
            amenity: 'cafe',
            'addr:street': 'Main Street',
            'addr:housenumber': '42',
            'addr:city': 'Frankfurt',
            phone: '+49 69 123456',
            website: 'https://example.com'
          }
        },
        {
          type: 'way',
          id: 456,
          center: {
            lat: 50.1110,
            lon: 8.6822
          },
          tags: {
            name: 'Test Restaurant',
            amenity: 'restaurant',
            'addr:street': 'Second Street',
            'addr:city': 'Frankfurt'
          }
        }
      ]
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const { findNearbyPOIs, loading, error, pois } = useOverpass()

    const result = await findNearbyPOIs(50.1109, 8.6821, 50)

    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
    expect(result).toHaveLength(2)
    expect(pois.value).toHaveLength(2)

    // Check first POI (node)
    expect(result[0]).toEqual({
      id: 123,
      name: 'Test Cafe',
      lat: 50.1109,
      lng: 8.6821,
      type: 'cafe',
      address: 'Main Street 42, Frankfurt',
      phone: '+49 69 123456',
      website: 'https://example.com'
    })

    // Check second POI (way with center)
    expect(result[1]).toEqual({
      id: 456,
      name: 'Test Restaurant',
      lat: 50.1110,
      lng: 8.6822,
      type: 'restaurant',
      address: 'Second Street, Frankfurt',
      phone: undefined,
      website: undefined
    })
  })

  it('should handle empty results', async () => {
    const mockResponse = {
      elements: []
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const { findNearbyPOIs, loading, error, pois } = useOverpass()

    const result = await findNearbyPOIs(50.1109, 8.6821, 50)

    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
    expect(result).toEqual([])
    expect(pois.value).toEqual([])
  })

  it('should handle network error', async () => {
    // Mock all fetch attempts to fail (composable tries 3 endpoints)
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const { findNearbyPOIs, loading, error } = useOverpass()

    const result = await findNearbyPOIs(50.1109, 8.6821, 50)

    expect(loading.value).toBe(false)
    expect(error.value).toBe('Overpass API error: Network error')
    expect(result).toEqual([])
  })

  it('should handle HTTP error response', async () => {
    // Mock all fetch attempts to return HTTP error (composable tries 3 endpoints)
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    } as Response)

    const { findNearbyPOIs, error } = useOverpass()

    const result = await findNearbyPOIs(50.1109, 8.6821, 50)

    expect(error.value).toBe('Overpass API error: 500 Internal Server Error')
    expect(result).toEqual([])
  })

  it('should handle rate limit error (429)', async () => {
    // Mock all fetch attempts to return rate limit error (composable tries 3 endpoints)
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests'
    } as Response)

    const { findNearbyPOIs, error } = useOverpass()

    await findNearbyPOIs(50.1109, 8.6821, 50)

    expect(error.value).toContain('429')
  })

  it('should support request cancellation with AbortController', async () => {
    const abortController = new AbortController()
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'

    vi.mocked(fetch).mockRejectedValueOnce(abortError)

    const { findNearbyPOIs, error } = useOverpass()

    // Abort immediately
    abortController.abort()

    const result = await findNearbyPOIs(50.1109, 8.6821, 50, abortController.signal)

    expect(result).toEqual([])
    expect(error.value).toBe('Request was cancelled')
  })

  it('should filter out POIs without names', async () => {
    const mockResponse = {
      elements: [
        {
          type: 'node',
          id: 123,
          lat: 50.1109,
          lon: 8.6821,
          tags: {
            name: 'Named Cafe',
            amenity: 'cafe'
          }
        },
        {
          type: 'node',
          id: 124,
          lat: 50.1110,
          lon: 8.6822,
          tags: {
            amenity: 'restaurant'
            // No name
          }
        }
      ]
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const { findNearbyPOIs } = useOverpass()

    const result = await findNearbyPOIs(50.1109, 8.6821, 50)

    // Should only return the POI with a name
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Named Cafe')
  })

  it('should set loading state during fetch', async () => {
    const mockResponse = {
      elements: []
    }

    let loadingDuringFetch = false

    vi.mocked(fetch).mockImplementation(() => {
      const { loading } = useOverpass()
      loadingDuringFetch = loading.value
      return Promise.resolve({
        ok: true,
        json: async () => mockResponse
      } as Response)
    })

    const { findNearbyPOIs, loading } = useOverpass()

    const promise = findNearbyPOIs(50.1109, 8.6821, 50)

    // Loading should be true during fetch
    expect(loading.value).toBe(true)

    await promise

    // Loading should be false after completion
    expect(loading.value).toBe(false)
  })

  it('should clear error on successful request after previous error', async () => {
    const { findNearbyPOIs, error } = useOverpass()

    // First request fails (mock all 3 endpoint attempts)
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))

    await findNearbyPOIs(50.1109, 8.6821, 50)
    expect(error.value).toBe('Overpass API error: Network error')

    // Second request succeeds (first endpoint succeeds)
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ elements: [] })
    } as Response)

    await findNearbyPOIs(50.1109, 8.6821, 50)
    expect(error.value).toBe(null)
  })

  it('should construct correct Overpass query', async () => {
    const mockResponse = { elements: [] }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const { findNearbyPOIs } = useOverpass()

    await findNearbyPOIs(50.1109, 8.6821, 50)

    expect(fetch).toHaveBeenCalledWith(
      'https://overpass-api.de/api/interpreter',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('around:50,50.1109,8.6821')
      })
    )
  })

  it('should handle POIs with missing address fields gracefully', async () => {
    const mockResponse = {
      elements: [
        {
          type: 'node',
          id: 123,
          lat: 50.1109,
          lon: 8.6821,
          tags: {
            name: 'Test Place',
            amenity: 'cafe'
            // No address fields
          }
        }
      ]
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const { findNearbyPOIs } = useOverpass()

    const result = await findNearbyPOIs(50.1109, 8.6821, 50)

    expect(result[0].address).toBe(undefined)
  })

  it('should extract type from various OSM tag keys', async () => {
    const mockResponse = {
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 50.1109,
          lon: 8.6821,
          tags: {
            name: 'Place 1',
            amenity: 'cafe'
          }
        },
        {
          type: 'node',
          id: 2,
          lat: 50.1110,
          lon: 8.6822,
          tags: {
            name: 'Place 2',
            shop: 'bakery'
          }
        },
        {
          type: 'node',
          id: 3,
          lat: 50.1111,
          lon: 8.6823,
          tags: {
            name: 'Place 3',
            tourism: 'hotel'
          }
        }
      ]
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const { findNearbyPOIs } = useOverpass()

    const result = await findNearbyPOIs(50.1109, 8.6821, 100)

    expect(result[0].type).toBe('cafe')
    expect(result[1].type).toBe('bakery')
    expect(result[2].type).toBe('hotel')
  })
})
