import { ref } from 'vue'

export interface SubmissionData {
  name: string
  address: string
  city?: string
  postal_code?: string
  suburb?: string
  latitude: string
  longitude: string
  email: string
  submission_type: 'new' | 'update'
  description_de?: string
  description_en?: string
  website?: string
  phone?: string
  instagram?: string
  opening_hours_text?: string
  payment_methods?: any
  opening_hours_osm?: string
  opening_hours_structured?: any
  categories?: string[]
  related_location_id?: string
}

export interface ValidationErrors {
  [key: string]: string
}

// Edge Function URL
const SUBMIT_LOCATION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-location`

export function useSubmission() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const success = ref(false)
  const errors = ref<ValidationErrors>({})

  function validate(data: Partial<SubmissionData>): boolean {
    errors.value = {}

    // Required fields
    if (!data.name || data.name.trim() === '') {
      errors.value.name = 'Name is required'
    }

    if (!data.address || data.address.trim() === '') {
      errors.value.address = 'Address is required'
    }

    if (!data.latitude || data.latitude.trim() === '') {
      errors.value.latitude = 'Latitude is required'
    } else {
      const lat = parseFloat(data.latitude)
      if (isNaN(lat)) {
        errors.value.latitude = 'Latitude must be a number'
      } else if (lat < -90 || lat > 90) {
        errors.value.latitude = 'Latitude must be between -90 and 90'
      }
    }

    if (!data.longitude || data.longitude.trim() === '') {
      errors.value.longitude = 'Longitude is required'
    } else {
      const lng = parseFloat(data.longitude)
      if (isNaN(lng)) {
        errors.value.longitude = 'Longitude must be a number'
      } else if (lng < -180 || lng > 180) {
        errors.value.longitude = 'Longitude must be between -180 and 180'
      }
    }

    if (!data.email || data.email.trim() === '') {
      errors.value.email = 'Email is required'
    } else {
      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        errors.value.email = 'Email is invalid'
      }
    }

    return Object.keys(errors.value).length === 0
  }

  async function submit(data: SubmissionData): Promise<void> {
    loading.value = true
    error.value = null
    success.value = false

    try {
      // Call the Edge Function to submit the location
      const response = await fetch(SUBMIT_LOCATION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          ...data,
          city: data.city || 'Frankfurt',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit location')
      }

      success.value = true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Network error occurred'
    } finally {
      loading.value = false
    }
  }

  function clearErrors(): void {
    errors.value = {}
  }

  return {
    loading,
    error,
    success,
    errors,
    validate,
    submit,
    clearErrors
  }
}
