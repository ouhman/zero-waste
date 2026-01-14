<template>
  <div
    class="fixed inset-0 z-[1003] flex items-center justify-center p-4 bg-black/50"
    @click.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <div class="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-5 border-b border-gray-100 bg-gray-50">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">{{ t('hoursSuggestion.title') }}</h2>
            <p class="text-sm text-gray-500 mt-0.5">{{ locationName }}</p>
          </div>
          <button
            @click="emit('close')"
            class="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            :aria-label="t('common.close')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Helper links -->
        <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <a
            v-if="website"
            :href="website"
            target="_blank"
            rel="noopener"
            class="text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            {{ t('hoursSuggestion.checkWebsite') }}
          </a>
          <a
            :href="googleMapsUrl"
            target="_blank"
            rel="noopener"
            class="text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {{ t('hoursSuggestion.checkGoogleMaps') }}
          </a>
        </div>
      </div>

      <!-- Form -->
      <div class="px-6 py-5 overflow-y-auto max-h-[60vh]">
        <!-- Day-by-day inputs - table layout -->
        <div class="space-y-2">
          <!-- Header row -->
          <div class="grid grid-cols-[100px_70px_1fr] gap-4 pb-2 border-b border-gray-100">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ t('hoursSuggestion.day') }}</span>
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide text-center">{{ t('hoursSuggestion.closed') }}</span>
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide text-right">{{ t('hoursSuggestion.hours') }}</span>
          </div>

          <!-- Day rows -->
          <div
            v-for="(day, index) in DAYS"
            :key="day"
            class="grid grid-cols-[100px_70px_1fr] gap-4 items-center py-2"
            :class="{ 'bg-gray-50 -mx-2 px-2 rounded-lg': index === todayIndex }"
          >
            <!-- Day name -->
            <div class="text-sm text-gray-700" :class="{ 'font-semibold': index === todayIndex }">
              {{ getDayName(day) }}
              <span v-if="index === todayIndex" class="block text-xs text-emerald-600">({{ t('hoursSuggestion.today') }})</span>
            </div>

            <!-- Closed checkbox -->
            <div class="flex justify-center">
              <input
                type="checkbox"
                :checked="hours[day].closed"
                @change="toggleClosed(day)"
                class="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <!-- Time inputs -->
            <div class="flex items-center gap-2">
              <template v-if="!hours[day].closed">
                <input
                  v-model="hours[day].opens"
                  type="time"
                  class="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  :class="hasTimeError(day) ? 'border-red-300 bg-red-50' : 'border-gray-300'"
                />
                <span class="text-gray-400 text-sm">–</span>
                <input
                  v-model="hours[day].closes"
                  type="time"
                  class="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  :class="hasTimeError(day) ? 'border-red-300 bg-red-50' : 'border-gray-300'"
                />
              </template>
              <span v-else class="text-sm text-gray-400 italic">{{ t('hoursSuggestion.markedClosed') }}</span>
            </div>
          </div>
        </div>

        <!-- Validation error -->
        <div v-if="validationErrors.length > 0" class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p class="text-sm text-amber-700">{{ t('hoursSuggestion.timeValidationError') }}</p>
        </div>

        <!-- Note field -->
        <div class="mt-6 pt-4 border-t border-gray-100">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ t('hoursSuggestion.noteLabel') }}
            <span class="text-gray-400 font-normal ml-1">({{ t('hoursSuggestion.optional') }})</span>
          </label>
          <textarea
            v-model="note"
            rows="2"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            :placeholder="t('hoursSuggestion.notePlaceholder')"
          />
        </div>

        <!-- Rate limit warning -->
        <div v-if="rateLimitExceeded" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-700">{{ t('hoursSuggestion.rateLimitError') }}</p>
        </div>

        <!-- Error -->
        <div v-if="error && !rateLimitExceeded" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
        <button
          @click="emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          @click="submit"
          :disabled="isSubmitting || validationErrors.length > 0"
          class="px-5 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {{ isSubmitting ? t('common.loading') : t('hoursSuggestion.submit') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHoursSuggestion } from '@/composables/useHoursSuggestion'
import { useAnalytics } from '@/composables/useAnalytics'
import { parseStructuredHours } from '@/composables/useNominatim'
import type { StructuredOpeningHours } from '@/types/osm'

const props = defineProps<{
  locationId: string
  locationSlug: string
  locationName: string
  currentHours: StructuredOpeningHours | null
  osmFormat?: string | null
  website?: string | null
  city?: string | null
  suburb?: string | null
}>()

const emit = defineEmits<{
  close: []
  submitted: []
}>()

const { t, locale } = useI18n()
const { submitSuggestion, isSubmitting, error, rateLimitExceeded } = useHoursSuggestion()
const { trackEditSuggestionSubmitted } = useAnalytics()

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

type DayHours = { opens: string; closes: string; closed: boolean }

// Google Maps URL - search by name, suburb, and city to show business listing
const googleMapsUrl = computed(() => {
  const parts = [props.locationName]
  if (props.suburb) parts.push(props.suburb)
  if (props.city) parts.push(props.city)
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(' '))}`
})

// Get today's day index (0 = Monday, 6 = Sunday)
const todayIndex = computed(() => {
  const jsDay = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
  return jsDay === 0 ? 6 : jsDay - 1 // Convert to our format (0 = Monday)
})

// Get effective hours - try structured first, then parse OSM format
const effectiveHours = computed((): StructuredOpeningHours | null => {
  // Use provided structured hours if available
  if (props.currentHours?.entries?.length) {
    return props.currentHours
  }
  // Try to parse OSM format
  if (props.osmFormat) {
    const parsed = parseStructuredHours(props.osmFormat)
    if (parsed?.entries?.length) {
      return parsed
    }
  }
  return null
})

// Initialize hours from current hours
const initializeHours = () => {
  const initialHours: Record<string, DayHours> = {}
  const currentEntries = effectiveHours.value?.entries || []

  for (const day of DAYS) {
    const entry = currentEntries.find(e => e.day === day)

    if (entry) {
      // Entry exists - use its values
      initialHours[day] = {
        opens: entry.opens || '09:00',
        closes: entry.closes || '18:00',
        closed: entry.opens === null
      }
    } else {
      // No entry - default to open with standard hours
      initialHours[day] = {
        opens: '09:00',
        closes: '18:00',
        closed: false
      }
    }
  }
  return initialHours
}

const hours = reactive<Record<string, DayHours>>(initializeHours())
const note = ref('')

// Time validation - check if opens is before closes
function hasTimeError(day: string): boolean {
  const dayHours = hours[day]
  if (dayHours.closed) return false
  if (!dayHours.opens || !dayHours.closes) return false
  return dayHours.opens >= dayHours.closes
}

// Get all validation errors
const validationErrors = computed(() => {
  const errors: string[] = []
  for (const day of DAYS) {
    if (hasTimeError(day)) {
      errors.push(day)
    }
  }
  return errors
})

// Add ESC key listener
onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

function toggleClosed(day: string) {
  hours[day].closed = !hours[day].closed
}

function getDayName(day: string): string {
  const names = {
    de: {
      monday: 'Montag',
      tuesday: 'Dienstag',
      wednesday: 'Mittwoch',
      thursday: 'Donnerstag',
      friday: 'Freitag',
      saturday: 'Samstag',
      sunday: 'Sonntag'
    },
    en: {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday'
    }
  }
  const loc = locale.value as 'de' | 'en'
  return names[loc]?.[day as keyof typeof names['de']] || day
}

async function submit() {
  // Don't submit if there are validation errors
  if (validationErrors.value.length > 0) return

  const suggestedHours: StructuredOpeningHours = {
    entries: DAYS.map(day => ({
      day,
      opens: hours[day].closed ? null : hours[day].opens,
      closes: hours[day].closed ? null : hours[day].closes
    }))
  }

  const result = await submitSuggestion(props.locationId, suggestedHours, note.value)

  if (result.success) {
    trackEditSuggestionSubmitted(props.locationSlug)
    emit('submitted')
    emit('close')
  }
}
</script>
