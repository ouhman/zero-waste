<template>
  <!--
    Step-by-Step Wizard (Typeform-inspired)
    - One section at a time
    - Progress indicator
    - Focused, distraction-free
  -->
  <div class="wizard">
    <!-- Progress -->
    <div class="progress">
      <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
    </div>
    <div class="progress-text">{{ t('submit.step') }} {{ currentStep }} {{ t('submit.of') }} {{ totalSteps }}</div>

    <!-- Steps -->
    <form @submit.prevent="handleSubmit" class="steps-container">

      <!-- Step 1: Quick Start with Google Maps -->
      <div v-show="currentStep === 1" class="step">
        <div class="step-header">
          <span class="step-number">1</span>
          <h2 class="step-title">{{ t('submit.quickStartTitle') }}</h2>
          <p class="step-description">{{ t('submit.quickStartDescription') }}</p>
        </div>

        <div class="step-content">
          <input
            ref="googleMapsInput"
            v-model="googleMapsUrl"
            type="url"
            class="input input-large"
            :class="{ error: googleMapsError }"
            :placeholder="t('submit.googleMapsUrlPlaceholder')"
            :aria-describedby="googleMapsError ? 'google-maps-error' : undefined"
          />
          <p v-if="googleMapsError" id="google-maps-error" class="status-text error" role="alert">{{ googleMapsError }}</p>

          <!-- Enhanced enrichment status component -->
          <EnrichmentStatus
            v-if="enrichingLocation || enrichmentSummary || enrichmentError"
            :loading="enrichingLocation"
            :found-phone="foundPhone"
            :found-website="foundWebsite"
            :found-email="foundEmail"
            :found-hours="foundHours"
            :found-instagram="foundInstagram"
            :success="!!enrichmentSummary && !enrichmentError"
            :summary="enrichmentSummary"
            :error="enrichmentError"
          />

          <p v-else-if="parsingMapsUrl" class="status-text">🔍 {{ t('submit.googleMapsUrlParsing') }}</p>
          <p v-else-if="formData.name" class="status-text success">✓ {{ t('submit.found') }}: {{ formData.name }}</p>
        </div>

        <button type="button" class="btn btn-secondary" @click="currentStep = 2">
          {{ googleMapsUrl ? t('submit.continue') : t('submit.skipManual') }} →
        </button>
      </div>

      <!-- Step 2: Basic Info -->
      <div v-show="currentStep === 2" class="step">
        <div class="step-header">
          <span class="step-number">2</span>
          <h2 class="step-title">{{ t('submit.basicInfo') }}</h2>
          <p class="step-description">{{ t('submit.basicInfoDescription') }}</p>
        </div>

        <div class="step-content">
          <div class="field">
            <label class="label">{{ t('submit.nameQuestion') }}</label>
            <input
              ref="nameInput"
              v-model="formData.name"
              type="text"
              class="input input-large"
              :class="{ error: validationErrors.name }"
              :placeholder="t('submit.namePlaceholder')"
            />
            <p v-if="validationErrors.name" class="error-text">{{ validationErrors.name }}</p>
          </div>

          <div class="field">
            <label class="label">{{ t('submit.addressQuestion') }}</label>
            <input
              v-model="formData.address"
              type="text"
              class="input"
              :class="{ error: validationErrors.address }"
              :placeholder="t('submit.addressPlaceholder')"
              @blur="handleAddressBlur"
            />
            <p v-if="validationErrors.address" class="error-text">{{ validationErrors.address }}</p>
            <p v-if="geocoding" class="hint loading">🔍 {{ t('submit.geocoding') }}...</p>
          </div>

          <div class="field-row">
            <div class="field">
              <label class="label">{{ t('submit.city') }}</label>
              <input v-model="formData.city" type="text" class="input" />
            </div>
            <div class="field">
              <label class="label">{{ t('submit.postalCode') }}</label>
              <input v-model="formData.postal_code" type="text" class="input" placeholder="60311" />
            </div>
          </div>

          <details class="coordinates-toggle">
            <summary>{{ t('submit.coordinatesAutoFilled') }}</summary>
            <div class="field-row" style="margin-top: 12px;">
              <div class="field">
                <label class="label">{{ t('submit.latitude') }}</label>
                <input v-model="formData.latitude" type="text" class="input input-mono" placeholder="50.1109" />
              </div>
              <div class="field">
                <label class="label">{{ t('submit.longitude') }}</label>
                <input v-model="formData.longitude" type="text" class="input input-mono" placeholder="8.6821" />
              </div>
            </div>
          </details>
        </div>

        <div class="step-nav">
          <button type="button" class="btn btn-ghost" @click="currentStep = 1">← {{ t('submit.back') }}</button>
          <button type="button" class="btn btn-primary" @click="currentStep = 3" :disabled="!formData.name || !formData.address">
            {{ t('submit.continue') }} →
          </button>
        </div>
      </div>

      <!-- Step 3: Details -->
      <div v-show="currentStep === 3" class="step">
        <div class="step-header">
          <span class="step-number">3</span>
          <h2 class="step-title">{{ t('submit.addDetails') }}</h2>
          <p class="step-description">{{ t('submit.addDetailsDescription') }}</p>
        </div>

        <div class="step-content">
          <div class="field">
            <label class="label">{{ t('submit.descriptionDe') }}</label>
            <textarea
              v-model="formData.description_de"
              class="input textarea"
              rows="3"
              :placeholder="t('submit.descriptionPlaceholder')"
            />
          </div>

          <div class="field">
            <label class="label">{{ t('submit.website') }}</label>
            <input
              v-model="formData.website"
              type="url"
              class="input"
              placeholder="https://"
              :aria-describedby="isAutoFilled('website') ? 'website-autofilled' : undefined"
            />
            <FieldBadge
              v-if="isAutoFilled('website')"
              id="website-autofilled"
              :show="true"
              :source="getAutoFillSource('website')"
              @clear="clearAutoFilled('website')"
            />
          </div>

          <div class="field-row">
            <div class="field">
              <label class="label">{{ t('submit.phone') }}</label>
              <input
                v-model="formData.phone"
                type="tel"
                class="input"
                placeholder="+49 69..."
                :aria-describedby="isAutoFilled('phone') ? 'phone-autofilled' : undefined"
              />
              <FieldBadge
                v-if="isAutoFilled('phone')"
                id="phone-autofilled"
                :show="true"
                :source="getAutoFillSource('phone')"
                @clear="clearAutoFilled('phone')"
              />
            </div>
            <div class="field">
              <label class="label">{{ t('submit.instagram') }}</label>
              <input
                v-model="formData.instagram"
                type="text"
                class="input"
                placeholder="@"
                :aria-describedby="isAutoFilled('instagram') ? 'instagram-autofilled' : undefined"
              />
              <FieldBadge
                v-if="isAutoFilled('instagram')"
                id="instagram-autofilled"
                :show="true"
                :source="getAutoFillSource('instagram')"
                @clear="clearAutoFilled('instagram')"
              />
            </div>
          </div>

          <div class="field">
            <label class="label">{{ t('submit.openingHours') }}</label>
            <input
              v-model="formData.opening_hours_text"
              type="text"
              class="input"
              :placeholder="t('submit.openingHoursPlaceholder')"
              :aria-describedby="isAutoFilled('opening_hours_text') ? 'hours-autofilled' : undefined"
            />
            <FieldBadge
              v-if="isAutoFilled('opening_hours_text')"
              id="hours-autofilled"
              :show="true"
              :source="getAutoFillSource('opening_hours_text')"
              @clear="clearAutoFilled('opening_hours_text')"
            />
          </div>

          <!-- Info message if fields were auto-filled -->
          <div v-if="Object.keys(autoFilledFields).length > 0" class="auto-filled-info" role="status">
            <span class="info-icon" aria-hidden="true">ℹ️</span>
            <span>{{ t('submit.verifyAutoFilled') }}</span>
          </div>
        </div>

        <div class="step-nav">
          <button type="button" class="btn btn-ghost" @click="currentStep = 2">← {{ t('submit.back') }}</button>
          <button type="button" class="btn btn-primary" @click="currentStep = 4">
            {{ t('submit.continue') }} →
          </button>
        </div>
      </div>

      <!-- Step 4: Confirm -->
      <div v-show="currentStep === 4" class="step">
        <div class="step-header">
          <span class="step-number">4</span>
          <h2 class="step-title">{{ t('submit.almostThere') }}</h2>
          <p class="step-description">{{ t('submit.almostThereDescription') }}</p>
        </div>

        <div class="step-content">
          <div v-if="mode === 'submit'" class="field">
            <label class="label">{{ t('submit.emailQuestion') }}</label>
            <input
              v-model="formData.email"
              type="email"
              class="input input-large"
              :class="{ error: validationErrors.email }"
              placeholder="your@email.com"
            />
            <p v-if="validationErrors.email" class="error-text">{{ validationErrors.email }}</p>
            <p class="hint">{{ t('submit.emailHelp') }}</p>
          </div>

          <!-- Summary -->
          <div class="summary">
            <h4>{{ t('submit.summary') }}</h4>
            <div class="summary-item">
              <span class="summary-label">{{ t('submit.name') }}</span>
              <span class="summary-value">{{ formData.name || '—' }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">{{ t('submit.address') }}</span>
              <span class="summary-value">{{ formData.address || '—' }}, {{ formData.city }}</span>
            </div>
            <div v-if="formData.website" class="summary-item">
              <span class="summary-label">{{ t('submit.website') }}</span>
              <span class="summary-value">{{ formData.website }}</span>
            </div>
            <div v-if="formData.phone" class="summary-item">
              <span class="summary-label">{{ t('submit.phone') }}</span>
              <span class="summary-value">{{ formData.phone }}</span>
            </div>
            <div v-if="formData.opening_hours_text" class="summary-item">
              <span class="summary-label">{{ t('submit.openingHours') }}</span>
              <span class="summary-value">{{ formData.opening_hours_text }}</span>
            </div>
          </div>

          <!-- Missing fields warning -->
          <div v-if="missingFields.length > 0" class="missing-warning">
            <span class="warning-icon">⚠️</span>
            <span>{{ t('submit.missingFields') }}: {{ missingFields.join(', ') }}</span>
          </div>
        </div>

        <div class="step-nav">
          <button type="button" class="btn btn-ghost" @click="currentStep = 3">← {{ t('submit.back') }}</button>
          <button type="submit" class="btn btn-submit" :disabled="!isFormValid || loading">
            {{ loading ? t('common.loading') + '...' : t('submit.submitLocation') + ' ✓' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNominatim } from '@/composables/useNominatim'
import { useEnrichment } from '@/composables/useEnrichment'
import { parseGoogleMapsUrl, isGoogleMapsUrl } from '@/lib/googleMapsUrlParser'
import EnrichmentStatus from '@/components/ui/EnrichmentStatus.vue'
import FieldBadge from '@/components/ui/FieldBadge.vue'

interface Props {
  mode: 'submit' | 'edit'
  existingLocation?: any
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Input refs for auto-focus
const googleMapsInput = ref<HTMLInputElement | null>(null)
const nameInput = ref<HTMLInputElement | null>(null)

const emit = defineEmits<{
  submit: [data: any]
}>()

const { t } = useI18n()
const {
  debouncedGeocode,
  result: geocodeResult,
  reverseGeocode,
  reverseResult,
  loading: geocoding,
  error: nominatimError,
  searchWithExtras,
  enrichedResult
} = useNominatim()

const {
  enrichFromWebsite
} = useEnrichment()

const currentStep = ref(1)
const totalSteps = 4

const formData = ref({
  submission_type: 'new',
  name: '',
  address: '',
  city: 'Frankfurt',
  postal_code: '',
  latitude: '',
  longitude: '',
  description_de: '',
  description_en: '',
  website: '',
  phone: '',
  email: '',
  instagram: '',
  opening_hours_text: '',
  payment_methods: null as any,
  opening_hours_osm: null as string | null,
  opening_hours_structured: null as any
})

const validationErrors = ref<Record<string, string>>({})

// Google Maps URL parsing
const googleMapsUrl = ref('')
const googleMapsError = ref('')
const parsingMapsUrl = ref(false)

// Location enrichment state
const enrichingLocation = ref(false)
const enrichmentSummary = ref('')
const enrichmentError = ref('')

// Track which fields were auto-filled
const autoFilledFields = ref<Record<string, 'osm' | 'website'>>({})

// Track progressive enrichment status
const foundPhone = ref(false)
const foundWebsite = ref(false)
const foundEmail = ref(false)
const foundHours = ref(false)
const foundInstagram = ref(false)

const progressPercent = computed(() => (currentStep.value / totalSteps) * 100)

// Helper functions for auto-filled field management
function markAsAutoFilled(fieldName: string, source: 'osm' | 'website') {
  autoFilledFields.value[fieldName] = source
}

function clearAutoFilled(fieldName: keyof typeof formData.value) {
  delete autoFilledFields.value[fieldName]
  formData.value[fieldName] = ''
}

function isAutoFilled(fieldName: string): boolean {
  return fieldName in autoFilledFields.value
}

function getAutoFillSource(fieldName: string): 'osm' | 'website' | undefined {
  return autoFilledFields.value[fieldName]
}

// Reset enrichment status indicators
function resetEnrichmentStatus() {
  foundPhone.value = false
  foundWebsite.value = false
  foundEmail.value = false
  foundHours.value = false
  foundInstagram.value = false
  enrichmentError.value = ''
}

// Clear all auto-filled fields (called when user enters a new Google Maps URL)
function clearAutoFilledData() {
  // Clear ALL enrichable fields to ensure fresh enrichment
  // This prevents mixing data from different locations

  // Clear contact fields
  formData.value.phone = ''
  formData.value.email = ''
  formData.value.website = ''
  formData.value.instagram = ''

  // Clear opening hours
  formData.value.opening_hours_text = ''
  formData.value.opening_hours_osm = null
  formData.value.opening_hours_structured = null

  // Clear payment methods
  formData.value.payment_methods = null

  // Clear address fields (but keep coordinates and name - they come from URL/manual entry)
  formData.value.address = ''
  formData.value.city = 'Frankfurt' // Reset to default
  formData.value.postal_code = ''

  // Clear the auto-filled tracker
  autoFilledFields.value = {}

  // Reset enrichment status
  resetEnrichmentStatus()
}

// Prefill form in edit mode and auto-focus
onMounted(async () => {
  if (props.mode === 'edit' && props.existingLocation) {
    formData.value = {
      ...formData.value,
      ...props.existingLocation
    }
    // Skip to step 2 in edit mode
    currentStep.value = 2
    await nextTick()
    nameInput.value?.focus()
  } else {
    // Focus on Google Maps input for new submissions
    await nextTick()
    googleMapsInput.value?.focus()
  }
})

// Auto-focus when changing steps
watch(currentStep, async (step) => {
  await nextTick()
  if (step === 1) {
    googleMapsInput.value?.focus()
  } else if (step === 2) {
    nameInput.value?.focus()
  }
})

// Watch for geocoding results
watch(geocodeResult, (result) => {
  if (result) {
    formData.value.latitude = result.lat.toString()
    formData.value.longitude = result.lng.toString()
  }
})

// Watch for reverse geocoding results (from Google Maps URL)
watch(reverseResult, (result) => {
  if (result) {
    // Only fill empty fields
    if (!formData.value.address && result.address) {
      formData.value.address = result.address
    }
    if (!formData.value.city && result.city) {
      formData.value.city = result.city
    }
    if (!formData.value.postal_code && result.postalCode) {
      formData.value.postal_code = result.postalCode
    }
    parsingMapsUrl.value = false
  }
})

// Store parsed coords for fallback
const parsedCoords = ref<{ lat: number; lng: number; name?: string } | null>(null)

// Watch for nominatim errors (e.g., "No results found") and fallback to reverse geocoding
watch(nominatimError, async (error) => {
  if (error && enrichingLocation.value && parsedCoords.value) {
    console.debug('Nominatim search failed, falling back to reverse geocoding:', error)

    // Fallback to reverse geocode
    try {
      await reverseGeocode(parsedCoords.value.lat, parsedCoords.value.lng)
    } catch (e) {
      console.error('Reverse geocode fallback failed:', e)
    }

    enrichingLocation.value = false
    enrichmentSummary.value = t('submit.noAdditionalDetails')
    parsingMapsUrl.value = false
  }
})

// Watch for enriched results (from searchWithExtras)
watch(enrichedResult, async (result) => {
  if (result) {
    // IMPORTANT: Clear previously auto-filled data when new enrichment arrives
    // This ensures we don't mix data from different locations
    if (Object.keys(autoFilledFields.value).length > 0) {
      clearAutoFilledData()
    }

    resetEnrichmentStatus()
    let autoFilledCount = 0

    // Fill address/city/postal if empty
    if (!formData.value.address && result.address) {
      formData.value.address = result.address
      markAsAutoFilled('address', 'osm')
      autoFilledCount++
    }
    if (!formData.value.city && result.city) {
      formData.value.city = result.city
      markAsAutoFilled('city', 'osm')
    }
    if (!formData.value.postal_code && result.postalCode) {
      formData.value.postal_code = result.postalCode
      markAsAutoFilled('postal_code', 'osm')
    }

    // Fill business metadata with progressive status updates
    if (!formData.value.phone && result.phone) {
      formData.value.phone = result.phone
      markAsAutoFilled('phone', 'osm')
      foundPhone.value = true
      autoFilledCount++
      await new Promise(resolve => setTimeout(resolve, 150)) // Small delay for animation
    }

    if (!formData.value.website && result.website) {
      formData.value.website = result.website
      markAsAutoFilled('website', 'osm')
      foundWebsite.value = true
      autoFilledCount++
      await new Promise(resolve => setTimeout(resolve, 150))
    }

    if (!formData.value.email && result.email) {
      formData.value.email = result.email
      markAsAutoFilled('email', 'osm')
      foundEmail.value = true
      autoFilledCount++
      await new Promise(resolve => setTimeout(resolve, 150))
    }

    if (!formData.value.opening_hours_text && result.openingHoursFormatted) {
      formData.value.opening_hours_text = result.openingHoursFormatted
      markAsAutoFilled('opening_hours_text', 'osm')
      foundHours.value = true
      autoFilledCount++
      await new Promise(resolve => setTimeout(resolve, 150))
    }

    // Store OSM opening hours data (both raw and structured)
    if (result.openingHoursOsm) {
      formData.value.opening_hours_osm = result.openingHoursOsm
    }
    if (result.openingHoursStructured) {
      formData.value.opening_hours_structured = result.openingHoursStructured
    }

    // Store payment methods from OSM
    if (result.paymentMethods) {
      formData.value.payment_methods = result.paymentMethods
    }

    // Instagram discovery chain: OSM first, then website fallback
    if (!formData.value.instagram) {
      // Step 1: Check OSM contact:instagram field first
      if (result.instagram) {
        formData.value.instagram = result.instagram
        markAsAutoFilled('instagram', 'osm')
        foundInstagram.value = true
        autoFilledCount++
        await new Promise(resolve => setTimeout(resolve, 150))
      }
      // Step 2: If no OSM instagram and we have a website, scrape website
      else if (result.website) {
        try {
          const websiteData = await enrichFromWebsite(result.website)

          if (websiteData) {
            // Fill Instagram if found from website
            if (websiteData.instagram && !formData.value.instagram) {
              formData.value.instagram = websiteData.instagram
              markAsAutoFilled('instagram', 'website')
              foundInstagram.value = true
              autoFilledCount++
              await new Promise(resolve => setTimeout(resolve, 150))
            }
          }
        } catch (err) {
          console.debug('Website enrichment failed:', err)
        }
      }
    }

    // If we have a website, try to enrich other fields from website (phone, email, hours)
    // Note: Instagram is handled separately above in the Instagram discovery chain
    if (result.website) {
      // Check if we already called enrichFromWebsite for Instagram
      // If so, reuse that data to avoid duplicate API calls
      const needsWebsiteEnrichment = !result.instagram && (
        !formData.value.phone ||
        !formData.value.email ||
        !formData.value.opening_hours_text
      )

      if (needsWebsiteEnrichment) {
        try {
          const websiteData = await enrichFromWebsite(result.website)

          if (websiteData) {
            // Fill any other missing fields from website
            if (websiteData.phone && !formData.value.phone) {
              formData.value.phone = websiteData.phone
              markAsAutoFilled('phone', 'website')
              foundPhone.value = true
              autoFilledCount++
            }
            if (websiteData.email && !formData.value.email) {
              formData.value.email = websiteData.email
              markAsAutoFilled('email', 'website')
              foundEmail.value = true
              autoFilledCount++
            }
            if (websiteData.openingHours && !formData.value.opening_hours_text) {
              formData.value.opening_hours_text = websiteData.openingHours
              markAsAutoFilled('opening_hours_text', 'website')
              foundHours.value = true
              autoFilledCount++
            }
          }
        } catch (e) {
          // Silently fail if website enrichment doesn't work
          console.debug('Website enrichment skipped:', e)
        }
      }
    }

    // Update enrichment summary
    if (autoFilledCount > 0) {
      enrichmentSummary.value = t('submit.autoFilledSummary', { count: autoFilledCount })
    } else {
      enrichmentSummary.value = t('submit.noAdditionalDetails')
    }

    enrichingLocation.value = false
    parsingMapsUrl.value = false
  }
})

// Watch for Google Maps URL changes
watch(googleMapsUrl, async (url) => {
  if (!url || url.trim() === '') {
    googleMapsError.value = ''
    return
  }

  // Check if it looks like a Google Maps URL
  if (!isGoogleMapsUrl(url)) {
    googleMapsError.value = t('submit.googleMapsUrlError')
    return
  }

  // Parse the URL
  const coords = parseGoogleMapsUrl(url)

  if (!coords) {
    googleMapsError.value = t('submit.googleMapsUrlError')
    return
  }

  // Clear error and set loading
  googleMapsError.value = ''
  parsingMapsUrl.value = true
  enrichmentSummary.value = ''

  // IMPORTANT: Clear all previously auto-filled data when processing a new URL
  // This prevents old enrichment data from persisting when user changes the URL
  clearAutoFilledData()

  // Store coords for potential fallback
  parsedCoords.value = coords

  // Fill coordinates
  formData.value.latitude = coords.lat.toString()
  formData.value.longitude = coords.lng.toString()

  // Fill name if extracted
  if (coords.name) {
    formData.value.name = coords.name
  }

  // Instead of just reverse geocoding, use searchWithExtras to get business metadata
  enrichingLocation.value = true
  enrichmentError.value = ''
  enrichmentSummary.value = ''

  try {
    if (coords.name) {
      // If we have a name, search for it with coordinates to get extra details
      // Note: The nominatimError watch will handle fallback if no results found
      await searchWithExtras(coords.name, coords.lat, coords.lng)
    } else {
      // Fallback to reverse geocode if no name
      await reverseGeocode(coords.lat, coords.lng)
      enrichingLocation.value = false
      enrichmentSummary.value = t('submit.noAdditionalDetails')
    }
  } catch (e) {
    // On error, still try basic reverse geocode
    console.error('Enrichment error:', e)
    enrichmentError.value = t('submit.couldNotFetchDetails')

    try {
      await reverseGeocode(coords.lat, coords.lng)
    } catch (reverseError) {
      console.error('Reverse geocode error:', reverseError)
      // Even reverse geocoding failed, just continue with what we have
    }

    enrichingLocation.value = false
    parsingMapsUrl.value = false
  }
})

function handleAddressBlur() {
  if (formData.value.address && !formData.value.latitude) {
    debouncedGeocode(formData.value.address)
  }
}

const isFormValid = computed(() => {
  return (
    formData.value.name.trim() !== '' &&
    formData.value.address.trim() !== '' &&
    formData.value.latitude.trim() !== '' &&
    formData.value.longitude.trim() !== '' &&
    (props.mode === 'edit' || formData.value.email.trim() !== '')
  )
})

const missingFields = computed(() => {
  const missing: string[] = []

  if (!formData.value.name.trim()) {
    missing.push(t('submit.name'))
  }
  if (!formData.value.address.trim()) {
    missing.push(t('submit.address'))
  }
  if (!formData.value.latitude.trim()) {
    missing.push(t('submit.latitude'))
  }
  if (!formData.value.longitude.trim()) {
    missing.push(t('submit.longitude'))
  }
  if (props.mode === 'submit' && !formData.value.email.trim()) {
    missing.push(t('submit.email'))
  }

  return missing
})

function handleSubmit() {
  // Clear previous errors
  validationErrors.value = {}

  // Basic validation
  if (!formData.value.name.trim()) {
    validationErrors.value.name = t('submit.required')
  }
  if (!formData.value.address.trim()) {
    validationErrors.value.address = t('submit.required')
  }
  if (!formData.value.latitude.trim()) {
    validationErrors.value.latitude = t('submit.required')
  }
  if (!formData.value.longitude.trim()) {
    validationErrors.value.longitude = t('submit.required')
  }
  if (props.mode === 'submit' && !formData.value.email.trim()) {
    validationErrors.value.email = t('submit.required')
  }

  // If validation errors, don't submit
  if (Object.keys(validationErrors.value).length > 0) {
    return
  }

  // Emit submit event
  emit('submit', formData.value)
}
</script>

<style scoped>
.wizard {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 520px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
}

.progress {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  transition: width 300ms ease;
}

.progress-text {
  font-size: 12px;
  color: #9ca3af;
  text-align: right;
  margin-bottom: 32px;
}

.step {
  animation: fadeIn 300ms ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.step-header {
  margin-bottom: 32px;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
}

.step-title {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.step-description {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
}

.step-content {
  margin-bottom: 32px;
}

.field {
  margin-bottom: 20px;
}

.field:last-child {
  margin-bottom: 0;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 480px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}

.label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  transition: border-color 150ms, box-shadow 150ms;
  background: white;
}

.input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}

.input.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.input-large {
  padding: 16px 20px;
  font-size: 16px;
}

.input-mono {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 14px;
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.hint {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 8px;
}

.hint.loading {
  color: #10b981;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.error-text {
  font-size: 13px;
  color: #ef4444;
  margin-top: 6px;
}

.status-text {
  font-size: 14px;
  color: #6b7280;
  margin-top: 12px;
}

.status-text.success {
  color: #10b981;
}

.status-text.error {
  color: #ef4444;
}

.coordinates-toggle {
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  margin-top: 16px;
}

.coordinates-toggle summary {
  padding: 8px 0;
}

.summary {
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
}

.summary h4 {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 16px 0;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-label {
  font-size: 13px;
  color: #6b7280;
}

.summary-value {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

.missing-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  font-size: 13px;
  color: #92400e;
  margin-top: 16px;
}

.warning-icon {
  flex-shrink: 0;
}

.step-nav {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.btn {
  padding: 14px 28px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms;
}

.btn-primary {
  background: #10b981;
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: #059669;
}

.btn-primary:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: none;
  width: 100%;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-ghost {
  background: transparent;
  color: #6b7280;
  border: none;
}

.btn-ghost:hover {
  color: #374151;
}

.btn-submit {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  flex: 1;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-submit:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.auto-filled-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 8px;
  font-size: 13px;
  color: #1e40af;
  margin-top: 16px;
}

.info-icon {
  flex-shrink: 0;
  font-size: 16px;
}
</style>
