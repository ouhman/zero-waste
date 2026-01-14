<template>
  <div class="opening-hours">
    <!-- Always open categories (e.g., Bücherschrank, Trinkbrunnen) -->
    <div v-if="alwaysOpen" class="flex items-center gap-2 text-gray-600">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ t('openingHours.24_7') }}</span>
    </div>

    <!-- Special cases: 24/7 or by appointment -->
    <div v-else-if="isSpecial" class="flex items-center gap-2 text-gray-600">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ specialText }}</span>
    </div>

    <!-- Normal hours display -->
    <div v-else-if="hasHours">
      <!-- Collapsed: Today's hours -->
      <button
        @click="expanded = !expanded"
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 w-full text-left cursor-pointer transition-colors"
        :aria-expanded="expanded"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="flex-1">
          <span class="font-medium">{{ todayName }}:</span>
          {{ todayFormatted }}
        </span>
        <svg
          class="w-4 h-4 transition-transform"
          :class="{ 'rotate-180': expanded }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Expanded: Full week (Monday to Sunday) -->
      <div v-if="expanded" class="mt-3 ml-7 space-y-1">
        <div
          v-for="entry in weekFromMonday"
          :key="entry.day"
          class="flex justify-between text-sm py-1"
          :class="entry.day === today ? 'font-medium text-gray-900' : 'text-gray-600'"
        >
          <span>
            {{ getDayName(entry.day, locale as 'de' | 'en') }}
            <span v-if="entry.day === today" class="text-emerald-600 text-xs ml-1">({{ t('openingHours.today') }})</span>
          </span>
          <span>{{ formatHours(entry) }}</span>
        </div>

        <!-- Disclaimer -->
        <p class="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
          {{ t('openingHours.disclaimer') }}
        </p>

        <!-- Suggest edit link -->
        <button
          @click.stop="$emit('suggest-edit')"
          class="text-sm text-emerald-600 hover:text-emerald-700 hover:underline mt-2 cursor-pointer"
        >
          {{ t('openingHours.suggestEdit') }}
        </button>
      </div>
    </div>

    <!-- Fallback: Show raw text when structured data not available -->
    <div v-else-if="fallbackText">
      <!-- Collapsed: Show clock icon + text preview -->
      <button
        @click="fallbackExpanded = !fallbackExpanded"
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 w-full text-left cursor-pointer transition-colors"
        :aria-expanded="fallbackExpanded"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="flex-1 truncate">{{ fallbackTextPreview }}</span>
        <svg
          class="w-4 h-4 transition-transform flex-shrink-0"
          :class="{ 'rotate-180': fallbackExpanded }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Expanded: Show full text -->
      <div v-if="fallbackExpanded" class="mt-3 ml-7">
        <p class="text-sm text-gray-600 whitespace-pre-line">{{ fallbackText }}</p>

        <!-- Disclaimer -->
        <p class="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
          {{ t('openingHours.disclaimer') }}
        </p>

        <!-- Suggest edit link -->
        <button
          @click.stop="$emit('suggest-edit')"
          class="text-sm text-emerald-600 hover:text-emerald-700 hover:underline mt-2 cursor-pointer"
        >
          {{ t('openingHours.suggestEdit') }}
        </button>
      </div>
    </div>

    <!-- No hours available -->
    <div v-else class="space-y-2">
      <div class="flex items-center gap-2 text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ t('openingHours.notAvailable') }}</span>
      </div>
      <button
        @click.stop="$emit('suggest-edit')"
        class="text-sm text-emerald-600 hover:text-emerald-700 hover:underline ml-7 cursor-pointer"
      >
        {{ t('openingHours.iKnowTheHours') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOpeningHours } from '@/composables/useOpeningHours'
import { parseStructuredHours } from '@/composables/useNominatim'
import type { StructuredOpeningHours } from '@/types/osm'

const props = defineProps<{
  hours: StructuredOpeningHours | null
  osmFormat?: string | null
  fallbackText?: string | null
  alwaysOpen?: boolean
}>()

defineEmits<{
  'suggest-edit': []
}>()

const { t, locale } = useI18n()
const expanded = ref(false)
const fallbackExpanded = ref(false)

// Try to parse OSM format if structured hours not provided
const parsedHours = computed((): StructuredOpeningHours | null => {
  // Use provided structured hours if available (check for entries or special)
  if (props.hours?.entries?.length || props.hours?.special) {
    return props.hours
  }
  // Try to parse OSM format
  if (props.osmFormat) {
    const parsed = parseStructuredHours(props.osmFormat)
    if (parsed?.entries?.length || parsed?.special) {
      return parsed
    }
  }
  return null
})

const hoursRef = computed(() => parsedHours.value)

// Preview text for collapsed fallback view (when parsing fails)
const fallbackTextPreview = computed(() => {
  if (!props.fallbackText) return ''
  const firstLine = props.fallbackText.split('\n')[0]
  return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine
})

const {
  today,
  todayHours,
  formatHours,
  weekFromMonday,
  getDayName,
  isSpecial
} = useOpeningHours(hoursRef)

const hasHours = computed(() => parsedHours.value?.entries?.length && parsedHours.value.entries.length > 0)

const todayName = computed(() => getDayName(today.value, locale.value as 'de' | 'en'))
const todayFormatted = computed(() => formatHours(todayHours.value))

const specialText = computed(() => {
  if (props.hours?.special === '24/7') return t('openingHours.24_7')
  if (props.hours?.special === 'by_appointment') return t('openingHours.byAppointment')
  return ''
})
</script>
