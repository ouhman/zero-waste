import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useDebounce } from './useDebounce'
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row']

export function useSearch() {
  const results = ref<Location[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Track in-flight requests for deduplication
  const inFlightRequests = new Map<string, Promise<void>>()

  /**
   * Search locations using Supabase RPC function
   * @param searchTerm - Search query
   */
  async function search(searchTerm: string) {
    // Don't search for empty or very short strings
    if (!searchTerm || searchTerm.trim().length < 2) {
      results.value = []
      return
    }

    const normalizedTerm = searchTerm.trim()

    // Deduplication: Return existing promise if same search is already in-flight
    const existingRequest = inFlightRequests.get(normalizedTerm)
    if (existingRequest) {
      return existingRequest
    }

    loading.value = true
    error.value = null

    // Create new request promise
    const requestPromise = (async () => {
      try {
        const { data, error: searchError } = await supabase.rpc('search_locations', {
          search_term: normalizedTerm
        } as never)

        if (searchError) {
          error.value = searchError.message
          results.value = []
        } else {
          results.value = (data || []) as Location[]
        }
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Search error occurred'
        results.value = []
      } finally {
        loading.value = false
        // Clear from tracking when complete
        inFlightRequests.delete(normalizedTerm)
      }
    })()

    // Track the request
    inFlightRequests.set(normalizedTerm, requestPromise)

    return requestPromise
  }

  // Use debounce composable with 300ms delay
  const { debounced: debouncedSearch } = useDebounce(search, 300)

  return {
    results,
    loading,
    error,
    search,
    debouncedSearch
  }
}
