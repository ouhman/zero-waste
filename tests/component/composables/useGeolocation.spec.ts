import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useGeolocation } from '@/composables/useGeolocation'

describe('useGeolocation', () => {
  let mockGeolocation: {
    getCurrentPosition: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockGeolocation = {
      getCurrentPosition: vi.fn()
    }
    // @ts-ignore - mocking navigator.geolocation
    global.navigator.geolocation = mockGeolocation
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct default values', () => {
    const { loading, error, location } = useGeolocation()
    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
    expect(location.value).toBe(null)
  })

  it('should get user location successfully', async () => {
    const mockPosition = {
      coords: {
        latitude: 50.1109,
        longitude: 8.6821,
        accuracy: 10
      }
    }

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition)
    })

    const { getUserLocation, loading, error, location } = useGeolocation()

    const result = await getUserLocation()

    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
    expect(result).toEqual({
      lat: 50.1109,
      lng: 8.6821,
      accuracy: 10
    })
    expect(location.value).toEqual({
      lat: 50.1109,
      lng: 8.6821,
      accuracy: 10
    })
  })

  it('should handle permission denied error', async () => {
    const mockError = {
      code: 1, // PERMISSION_DENIED
      message: 'User denied geolocation',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3
    }

    mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
      error(mockError)
    })

    const { getUserLocation, loading, error, location } = useGeolocation()

    const result = await getUserLocation()

    expect(loading.value).toBe(false)
    expect(error.value).toBe('Location access denied. Please allow location access in your browser settings.')
    expect(result).toBe(null)
    expect(location.value).toBe(null)
  })

  it('should handle position unavailable error', async () => {
    const mockError = {
      code: 2, // POSITION_UNAVAILABLE
      message: 'Position unavailable',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3
    }

    mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
      error(mockError)
    })

    const { getUserLocation, error } = useGeolocation()

    await getUserLocation()

    expect(error.value).toBe('Could not determine your location. Try using the address search instead.')
  })

  it('should handle timeout error', async () => {
    const mockError = {
      code: 3, // TIMEOUT
      message: 'Timeout',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3
    }

    mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
      error(mockError)
    })

    const { getUserLocation, error } = useGeolocation()

    await getUserLocation()

    expect(error.value).toBe('Location request timed out. Please try again or use address search.')
  })

  it('should handle unknown error', async () => {
    const mockError = {
      code: 99, // Unknown
      message: 'Unknown error',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3
    }

    mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
      error(mockError)
    })

    const { getUserLocation, error } = useGeolocation()

    await getUserLocation()

    expect(error.value).toBe('Could not get your location. Please use address search instead.')
  })

  it('should handle unsupported browser', async () => {
    // @ts-ignore - simulating unsupported browser
    delete global.navigator.geolocation

    const { getUserLocation, error, loading } = useGeolocation()

    const result = await getUserLocation()

    expect(error.value).toBe('Geolocation is not supported by your browser')
    expect(loading.value).toBe(false)
    expect(result).toBe(null)
  })

  it('should set loading state during geolocation request', async () => {
    let capturedLoading = false

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      // Capture loading state during the async operation
      const { loading } = useGeolocation()
      capturedLoading = loading.value

      setTimeout(() => {
        success({
          coords: {
            latitude: 50.1109,
            longitude: 8.6821,
            accuracy: 10
          }
        })
      }, 10)
    })

    const { getUserLocation, loading } = useGeolocation()

    const promise = getUserLocation()

    // Loading should be true while waiting
    expect(loading.value).toBe(true)

    await promise

    // Loading should be false after completion
    expect(loading.value).toBe(false)
  })

  it('should clear error on successful request after previous error', async () => {
    const mockError = {
      code: 1,
      message: 'Denied',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3
    }

    mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
      error(mockError)
    })

    const { getUserLocation, error } = useGeolocation()

    // First request fails
    await getUserLocation()
    expect(error.value).toBe('Location access denied. Please allow location access in your browser settings.')

    // Second request succeeds
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 50.1109,
          longitude: 8.6821,
          accuracy: 10
        }
      })
    })

    await getUserLocation()
    expect(error.value).toBe(null)
  })
})
