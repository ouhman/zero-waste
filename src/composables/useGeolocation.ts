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

const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true, // Prefer GPS over network location (avoids Google rate limits)
  timeout: 15000, // 15 seconds
  maximumAge: 60000 // Accept cached position up to 1 minute old
}

export function useGeolocation() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const location = ref<GeolocationResult | null>(null)

  /**
   * Get user's current location from browser geolocation API
   * @param options - Optional geolocation settings
   * @returns Promise that resolves to location coordinates with accuracy, or null on error
   */
  async function getUserLocation(
    options: GeolocationOptions = {}
  ): Promise<GeolocationResult | null> {
    loading.value = true
    error.value = null

    const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        error.value = 'Geolocation is not supported by your browser'
        loading.value = false
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result: GeolocationResult = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
          location.value = result
          error.value = null
          loading.value = false
          resolve(result)
        },
        (err) => {
          // Handle different error types with user-friendly messages
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
          resolve(null)
        },
        {
          enableHighAccuracy: mergedOptions.enableHighAccuracy,
          timeout: mergedOptions.timeout,
          maximumAge: mergedOptions.maximumAge
        }
      )
    })
  }

  return {
    loading,
    error,
    location,
    getUserLocation
  }
}
