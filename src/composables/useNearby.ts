import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useGeolocation } from '@/composables/useGeolocation'
import type { Database } from '@/types/database'

type NearbyLocation = Database['public']['Functions']['locations_nearby']['Returns'][number]

export function useNearby() {
  const results = ref<NearbyLocation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const userLat = ref<number | null>(null)
  const userLng = ref<number | null>(null)

  // Use the extracted geolocation composable
  const geolocation = useGeolocation()

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
      } as never)

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
   * Now delegates to useGeolocation composable
   */
  async function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
    const result = await geolocation.getUserLocation()

    if (result) {
      // Update local refs for backward compatibility
      userLat.value = result.lat
      userLng.value = result.lng
      error.value = null
      return { lat: result.lat, lng: result.lng }
    } else {
      // Copy error from geolocation composable
      error.value = geolocation.error.value
      return null
    }
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
