import { ref } from 'vue'
import type { EnrichmentData, EnrichmentResponse } from '@/types/enrichment'

/**
 * Composable for enriching location data from business websites
 * Extracts schema.org data (Instagram, phone, email, hours)
 */
export function useEnrichment() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<EnrichmentData | null>(null)

  /**
   * Enrich location data from a business website
   * Calls the Supabase edge function to extract schema.org data
   */
  async function enrichFromWebsite(websiteUrl: string): Promise<EnrichmentData | null> {
    if (!websiteUrl || websiteUrl.trim() === '') {
      error.value = 'Website URL is required'
      return null
    }

    loading.value = true
    error.value = null
    data.value = null

    try {
      // Get Supabase URL from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured')
      }

      const url = `${supabaseUrl}/functions/v1/enrich-location`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({ websiteUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result: EnrichmentResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Enrichment failed')
      }

      data.value = result.data || null
      return data.value
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to enrich location'
      error.value = errorMessage
      console.error('Enrichment error:', errorMessage)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset state
   */
  function reset() {
    loading.value = false
    error.value = null
    data.value = null
  }

  return {
    loading,
    error,
    data,
    enrichFromWebsite,
    reset,
  }
}
