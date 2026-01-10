import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row']

export function useSearch() {
  const results = ref<Location[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

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

    loading.value = true
    error.value = null

    try {
      const { data, error: searchError } = await (supabase as any).rpc('search_locations', {
        search_term: searchTerm.trim()
      })

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
    }
  }

  /**
   * Debounced search (300ms delay)
   * @param searchTerm - Search query
   */
  function debouncedSearch(searchTerm: string) {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      search(searchTerm)
    }, 300)
  }

  return {
    results,
    loading,
    error,
    search,
    debouncedSearch
  }
}
