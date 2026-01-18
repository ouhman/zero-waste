import { ref } from 'vue'

const RATE_LIMIT_WINDOW_SECONDS = 240 // 4 minutes
const STORAGE_KEY = 'lastFeedbackSubmit'

/**
 * Composable for submitting user feedback
 * Handles rate limiting and submission to Supabase Edge Function
 */
export function useFeedback() {
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)
  const rateLimitExceeded = ref(false)
  const rateLimitRemaining = ref(0)

  /**
   * Check if user is currently rate limited
   * @returns true if rate limited, false otherwise
   */
  const checkRateLimit = (): boolean => {
    const lastSubmitStr = localStorage.getItem(STORAGE_KEY)

    if (!lastSubmitStr) {
      rateLimitExceeded.value = false
      rateLimitRemaining.value = 0
      return false
    }

    const lastSubmit = parseInt(lastSubmitStr, 10)
    const now = Date.now()
    const elapsedSeconds = Math.floor((now - lastSubmit) / 1000)
    const remainingSeconds = RATE_LIMIT_WINDOW_SECONDS - elapsedSeconds

    if (remainingSeconds > 0) {
      rateLimitExceeded.value = true
      rateLimitRemaining.value = remainingSeconds
      return true
    }

    rateLimitExceeded.value = false
    rateLimitRemaining.value = 0
    return false
  }

  /**
   * Submit feedback to the backend
   * @param message - User's feedback message
   * @param email - Optional email for reply
   * @returns Promise with success status
   */
  const submitFeedback = async (
    message: string,
    email?: string
  ): Promise<{ success: boolean }> => {
    isSubmitting.value = true
    error.value = null
    rateLimitExceeded.value = false

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (!supabaseUrl) {
        error.value = 'Supabase URL not configured'
        return { success: false }
      }

      const payload: { message: string; email?: string } = { message }
      if (email) {
        payload.email = email
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        // Try to parse error message
        let errorMessage = 'Failed to send feedback'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If JSON parsing fails, use default error message
          errorMessage = 'Failed to send feedback'
        }

        error.value = errorMessage

        // Set rate limit flag if 429
        if (response.status === 429) {
          rateLimitExceeded.value = true
        }

        return { success: false }
      }

      // Success - store timestamp in localStorage
      localStorage.setItem(STORAGE_KEY, Date.now().toString())

      return { success: true }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to send feedback'
      return { success: false }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    error,
    rateLimitExceeded,
    rateLimitRemaining,
    submitFeedback,
    checkRateLimit,
  }
}
