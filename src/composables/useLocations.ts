import { computed } from 'vue'
import { useLocationsStore } from '@/stores/locations'

export function useLocations() {
  const store = useLocationsStore()

  const locations = computed(() => store.approvedLocations)
  const loading = computed(() => store.loading)
  const error = computed(() => store.error)

  async function fetchLocations() {
    await store.fetchLocations()
  }

  function getLocationBySlug(slug: string) {
    return store.getLocationBySlug(slug)
  }

  return {
    locations,
    loading,
    error,
    fetchLocations,
    getLocationBySlug
  }
}
