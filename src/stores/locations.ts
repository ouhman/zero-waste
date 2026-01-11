import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { PaymentMethods, StructuredOpeningHours } from '@/types/osm'

// Simplified Location type to avoid deep type instantiation issues
interface Location {
  id: string
  name: string
  slug: string | null
  description_de: string | null
  description_en: string | null
  address: string
  city: string
  postal_code: string | null
  latitude: string
  longitude: string
  website: string | null
  phone: string | null
  email: string | null
  instagram: string | null
  opening_hours_text: string | null
  payment_methods: PaymentMethods | null
  opening_hours_osm: string | null
  opening_hours_structured: StructuredOpeningHours | null
  submission_type: string | null
  submitted_by_email: string | null
  related_location_id: string | null
  status: string | null
  approved_by: string | null
  rejection_reason: string | null
  admin_notes: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  location_categories?: {
    categories: {
      id: string
      name_de: string
      name_en: string
      slug: string
      icon: string | null
      color: string | null
      sort_order: number | null
      icon_url: string | null
      description_de: string | null
      description_en: string | null
      created_at: string
      updated_at: string | null
    }
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
