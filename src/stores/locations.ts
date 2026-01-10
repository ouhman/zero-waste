import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row'] & {
  location_categories?: {
    categories: Database['public']['Tables']['categories']['Row']
  }[]
}

export const useLocationsStore = defineStore('locations', () => {
  const locations = ref<Location[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasFetched = ref(false)

  const approvedLocations = computed(() => {
    return locations.value.filter(
      location => location.status === 'approved' && !location.deleted_at
    )
  })

  async function fetchLocations() {
    // Cache: Don't fetch if already loaded
    if (hasFetched.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('locations')
        .select(`
          *,
          location_categories(
            categories(*)
          )
        `)
        .eq('status', 'approved')
        .is('deleted_at', null)

      if (fetchError) {
        error.value = fetchError.message
      } else {
        locations.value = (data || []) as Location[]
        hasFetched.value = true
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error occurred'
    } finally {
      loading.value = false
    }
  }

  function getLocationBySlug(slug: string): Location | undefined {
    return locations.value.find(location => location.slug === slug)
  }

  return {
    locations,
    loading,
    error,
    approvedLocations,
    fetchLocations,
    getLocationBySlug
  }
})
