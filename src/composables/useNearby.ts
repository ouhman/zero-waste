import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type NearbyLocation = Database['public']['Functions']['locations_nearby']['Returns'][number]

export function useNearby() {
  const results = ref<NearbyLocation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const userLat = ref<number | null>(null)
  const userLng = ref<number | null>(null)

  /**
   * Find nearby locations using PostGIS
   * @param lat - Latitude
   * @param lng - Longitude
   * @param radiusMeters - Search radius in meters (default: 5000)
   */
  async function findNearby(lat: number, lng: number, radiusMeters: number = 5000) {
    loading.value = true
    error.value = null

    try {
      const { data, error: searchError } = await supabase.rpc('locations_nearby', {
        lat,
        lng,
        radius_meters: radiusMeters
      })

      if (searchError) {
        error.value = searchError.message
        results.value = []
      } else {
        results.value = (data || []) as NearbyLocation[]
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Nearby search error occurred'
      results.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Get user's current location from browser
   */
  async function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
    loading.value = true
    error.value = null

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        error.value = 'Geolocation is not supported by your browser'
        loading.value = false
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLat.value = position.coords.latitude
          userLng.value = position.coords.longitude
          error.value = null
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (err) => {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              error.value = 'Location access denied'
              break
            case err.POSITION_UNAVAILABLE:
              error.value = 'Location information unavailable'
              break
            case err.TIMEOUT:
              error.value = 'Location request timed out'
              break
            default:
              error.value = 'Unknown geolocation error'
          }
          loading.value = false
          resolve(null)
        }
      )
    })
  }

  return {
    results,
    loading,
    error,
    userLat,
    userLng,
    findNearby,
    getUserLocation
  }
}
