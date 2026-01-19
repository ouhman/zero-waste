import { ref } from 'vue'

export interface GeolocationResult {
  lat: number
  lng: number
  accuracy: number
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

// Fast network-based location (WiFi/IP) - usually works within 3-5 seconds
const FAST_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 5000,
  maximumAge: 60000
}

// High accuracy GPS location - fallback, can take 10-30+ seconds
const ACCURATE_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 60000
}

export function useGeolocation() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const location = ref<GeolocationResult | null>(null)

  /**
   * Internal helper to get position with specific options
   */
  function getPosition(options: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options)
    })
  }

  /**
   * Get user's current location from browser geolocation API
   * Uses a fallback strategy: fast network location first, then GPS if needed
   * @param options - Optional geolocation settings (overrides defaults)
   * @returns Promise that resolves to location coordinates with accuracy, or null on error
   */
  async function getUserLocation(
    options: GeolocationOptions = {}
  ): Promise<GeolocationResult | null> {
    loading.value = true
    error.value = null

    if (!navigator.geolocation) {
      error.value = 'Geolocation is not supported by your browser'
      loading.value = false
      return null
    }

    // If caller specifies options, use them directly (single attempt)
    if (Object.keys(options).length > 0) {
      const mergedOptions = { ...FAST_OPTIONS, ...options }
      try {
        const position = await getPosition(mergedOptions)
        const result: GeolocationResult = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
        location.value = result
        loading.value = false
        return result
      } catch (err) {
        handleError(err as GeolocationPositionError)
        return null
      }
    }

    // Default: Try fast network location first, fall back to GPS
    try {
      // First attempt: fast network-based location
      const position = await getPosition(FAST_OPTIONS)
      const result: GeolocationResult = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      }
      location.value = result
      loading.value = false
      return result
    } catch (fastError) {
      // Fast location failed, try high accuracy GPS as fallback
      // (unless it was a permission denial - no point retrying)
      const geoError = fastError as GeolocationPositionError
      if (geoError.code === geoError.PERMISSION_DENIED) {
        handleError(geoError)
        return null
      }

      try {
        const position = await getPosition(ACCURATE_OPTIONS)
        const result: GeolocationResult = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
        location.value = result
        loading.value = false
        return result
      } catch (accurateError) {
        handleError(accurateError as GeolocationPositionError)
        return null
      }
    }
  }

  /**
   * Handle geolocation errors with user-friendly messages
   */
  function handleError(err: GeolocationPositionError) {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        error.value = 'Location access denied. Please allow location access in your browser settings.'
        break
      case err.POSITION_UNAVAILABLE:
        error.value = 'Could not determine your location. Try using the address search instead.'
        break
      case err.TIMEOUT:
        error.value = 'Location request timed out. Please try again or use address search.'
        break
      default:
        error.value = 'Could not get your location. Please use address search instead.'
    }
    loading.value = false
    location.value = null
  }

  return {
    loading,
    error,
    location,
    getUserLocation
  }
}
