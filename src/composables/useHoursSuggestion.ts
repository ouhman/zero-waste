import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { StructuredOpeningHours } from '@/types/osm'
import type { HoursSuggestionInsert } from '@/types/hours'

/**
 * Simple hash function for rate limiting (not cryptographic, just for grouping)
 * Hashes IP address with a salt for privacy
 */
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + 'salt-for-hours-suggestions')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

/**
 * Composable for submitting opening hours suggestions
 * Handles rate limiting and submission to Supabase
 */
export function useHoursSuggestion() {
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)
  const rateLimitExceeded = ref(false)

  // Rate limit: max 5 suggestions per IP per hour
  const RATE_LIMIT = 5
  const RATE_WINDOW_HOURS = 1

  /**
   * Check if the IP hash has exceeded rate limit
   */
  const checkRateLimit = async (ipHash: string): Promise<boolean> => {
    const windowStart = new Date()
    windowStart.setHours(windowStart.getHours() - RATE_WINDOW_HOURS)

    const { count } = await supabase
      .from('hours_suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', windowStart.toISOString())

    return (count || 0) < RATE_LIMIT
  }

  /**
   * Submit a suggestion for opening hours correction
   */
  const submitSuggestion = async (
    locationId: string,
    suggestedHours: StructuredOpeningHours,
    note?: string
  ): Promise<{ success: boolean; error?: string }> => {
    isSubmitting.value = true
    error.value = null
    rateLimitExceeded.value = false

    try {
      // Get client IP - for now use a fallback since we don't have edge function yet
      // In production, this would call an edge function
      let ip = 'unknown'
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=text')
        if (ipResponse.ok) {
          ip = await ipResponse.text()
        }
      } catch {
        // Fallback to browser fingerprint-like value
        ip = navigator.userAgent + screen.width + screen.height
      }

      const ipHash = await hashIP(ip)

      // Check rate limit
      const withinLimit = await checkRateLimit(ipHash)
      if (!withinLimit) {
        rateLimitExceeded.value = true
        error.value = 'Too many suggestions. Please try again later.'
        return { success: false, error: error.value }
      }

      // Submit suggestion
      const payload: HoursSuggestionInsert = {
        location_id: locationId,
        suggested_hours: suggestedHours,
        note: note || undefined,
        ip_hash: ipHash
      }

      const { error: insertError } = await supabase
        .from('hours_suggestions')
        .insert(payload as any) // Type cast needed because Supabase types aren't generated yet

      if (insertError) {
        error.value = insertError.message
        return { success: false, error: error.value }
      }

      return { success: true }
    } catch (e) {
      error.value = 'Failed to submit suggestion'
      return { success: false, error: error.value }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    error,
    rateLimitExceeded,
    submitSuggestion
  }
}
