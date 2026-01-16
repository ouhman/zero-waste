<template>
  <div class="nearby-poi-selector">
    <!-- Back button -->
    <button
      type="button"
      class="btn-back cursor-pointer"
      data-testid="back-btn"
      @click="emit('back')"
      :aria-label="t('submit.back')"
    >
      ← {{ t('submit.back') }}
    </button>

    <!-- Header -->
    <div class="header">
      <h2 class="title">{{ t('submit.selectBusiness') }}</h2>
      <p class="subtitle">{{ selectedAddress }}</p>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" role="status" aria-live="polite">
        <svg class="spinner-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle class="spinner-circle" cx="12" cy="12" r="10" />
        </svg>
      </div>
      <p class="loading-text">{{ t('submit.findingNearby') }}</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-message" role="alert">
      {{ error }}
    </div>

    <!-- POI list or empty state -->
    <div v-else>
      <!-- POI count -->
      <p v-if="displayedPOIs.length > 0" class="poi-count">
        {{ t('submit.foundNearby', displayedPOIs.length) }}
      </p>

      <!-- POI cards -->
      <div v-if="displayedPOIs.length > 0" class="poi-list">
        <div
          v-for="poi in displayedPOIs"
          :key="poi.id"
          :data-testid="`poi-card-${poi.id}`"
          class="poi-card cursor-pointer"
          :class="{ selected: selectedPOI?.id === poi.id }"
          role="button"
          tabindex="0"
          :aria-label="`Select ${poi.name}, ${poi.type}`"
          @click="handlePOISelect(poi)"
          @keydown.enter.prevent="handlePOISelect(poi)"
          @keydown.space.prevent="handlePOISelect(poi)"
        >
          <!-- Checkmark for selected POI -->
          <div v-if="selectedPOI?.id === poi.id" class="checkmark" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <!-- POI content -->
          <div class="poi-content">
            <h3 class="poi-name">{{ poi.name }}</h3>
            <p class="poi-type">{{ formatType(poi.type) }}</p>
            <p v-if="poi.address" class="poi-address">{{ poi.address }}</p>
            <!-- Tap again hint for selected POI -->
            <p v-if="selectedPOI?.id === poi.id" class="tap-again-hint">
              {{ t('submit.tapAgainToConfirm') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        <p class="empty-text">{{ t('submit.noPOIsFound') }}</p>
      </div>

      <!-- Enter manually button -->
      <button
        type="button"
        class="btn-manual cursor-pointer"
        :class="{ 'with-spacing': displayedPOIs.length > 0 }"
        data-testid="enter-manually-btn"
        @click="handleEnterManually"
      >
        {{ t('submit.enterManually') }}
      </button>

      <!-- Continue button (shown when POI selected) -->
      <button
        v-if="selectedPOI"
        type="button"
        class="btn-continue cursor-pointer"
        @click="handleContinue"
      >
        {{ t('submit.continue') }} →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOverpass } from '@/composables/useOverpass'
import type { POI } from '@/composables/useOverpass'

interface Props {
  lat: number
  lng: number
  address: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'poi-selected': [data: {
    name: string
    lat: number
    lng: number
    address?: string
    phone?: string
    website?: string
    type: string
  }]
  'enter-manually': []
  back: []
}>()

const { t } = useI18n()
const { loading, error, pois, findNearbyPOIs } = useOverpass()

const selectedPOI = ref<POI | null>(null)
const abortController = ref<AbortController | null>(null)

// Limit displayed POIs to first 10
const displayedPOIs = computed(() => pois.value.slice(0, 10))

// Format address for display
const selectedAddress = computed(() => props.address)

/**
 * Format POI type for display (capitalize first letter)
 */
function formatType(type: string): string {
  if (!type || type === 'unknown') return ''
  return type.charAt(0).toUpperCase() + type.slice(1)
}

/**
 * Handle POI selection - tap once to select, tap again to confirm
 */
function handlePOISelect(poi: POI) {
  if (selectedPOI.value?.id === poi.id) {
    // Same POI clicked again - confirm selection
    handleContinue()
  } else {
    // New POI selected
    selectedPOI.value = poi
  }
}

/**
 * Handle continue with selected POI
 */
function handleContinue() {
  if (!selectedPOI.value) return

  emit('poi-selected', {
    name: selectedPOI.value.name,
    lat: selectedPOI.value.lat,
    lng: selectedPOI.value.lng,
    address: selectedPOI.value.address || props.address,
    phone: selectedPOI.value.phone,
    website: selectedPOI.value.website,
    type: selectedPOI.value.type
  })
}

/**
 * Handle enter manually
 */
function handleEnterManually() {
  emit('enter-manually')
}

/**
 * Fetch nearby POIs on mount
 */
onMounted(async () => {
  abortController.value = new AbortController()
  await findNearbyPOIs(props.lat, props.lng, 50, abortController.value.signal)
})

/**
 * Cleanup on unmount
 */
onUnmounted(() => {
  if (abortController.value) {
    abortController.value.abort()
  }
})
</script>

<style scoped>
.nearby-poi-selector {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.btn-back {
  align-self: flex-start;
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 0.875rem;
  padding: 0.5rem 0;
  transition: color 200ms ease;
}

.btn-back:hover {
  color: #111827;
}

:global(.dark) .btn-back {
  color: #9ca3af;
}

:global(.dark) .btn-back:hover {
  color: #d1d5db;
}

.header {
  text-align: center;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem;
}

.subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

:global(.dark) .title {
  color: #f3f4f6;
}

:global(.dark) .subtitle {
  color: #9ca3af;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 0;
}

.spinner {
  width: 48px;
  height: 48px;
}

.spinner-icon {
  animation: spin 1s linear infinite;
}

.spinner-circle {
  fill: none;
  stroke: #10b981;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 50;
  stroke-dashoffset: 25;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

:global(.dark) .loading-text {
  color: #9ca3af;
}

.error-message {
  padding: 0.75rem 1rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  color: #991b1b;
  font-size: 0.875rem;
}

:global(.dark) .error-message {
  background: rgba(127, 29, 29, 0.3);
  border-color: #991b1b;
  color: #fca5a5;
}

.poi-count {
  font-size: 0.875rem;
  font-weight: 500;
  color: #10b981;
  margin: 0 0 1rem;
  text-align: center;
}

.poi-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.poi-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  transition: all 200ms ease;
}

.poi-card:hover {
  border-color: #10b981;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.1);
}

.poi-card:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.poi-card.selected {
  border-color: #10b981;
  background: #ecfdf5;
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.2);
}

:global(.dark) .poi-card {
  background: #1f2937;
  border-color: #374151;
}

:global(.dark) .poi-card:hover {
  border-color: #34d399;
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.2);
}

:global(.dark) .poi-card:focus {
  border-color: #34d399;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

:global(.dark) .poi-card.selected {
  background: rgba(16, 185, 129, 0.1);
  border-color: #34d399;
}

.checkmark {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  color: #10b981;
}

.checkmark svg {
  width: 100%;
  height: 100%;
}

.poi-content {
  flex: 1;
}

.poi-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem;
}

.poi-type {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
  margin: 0 0 0.25rem;
}

.poi-address {
  font-size: 0.8125rem;
  color: #9ca3af;
  margin: 0;
}

:global(.dark) .poi-name {
  color: #f3f4f6;
}

:global(.dark) .poi-type {
  color: #9ca3af;
}

:global(.dark) .poi-address {
  color: #6b7280;
}

.tap-again-hint {
  font-size: 0.8125rem;
  color: #10b981;
  font-weight: 600;
  margin: 0.5rem 0 0;
  animation: fadeIn 200ms ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #d1d5db;
}

.empty-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

:global(.dark) .empty-icon {
  color: #4b5563;
}

:global(.dark) .empty-text {
  color: #9ca3af;
}

.btn-manual {
  width: 100%;
  padding: 1rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 200ms ease;
}

.btn-manual.with-spacing {
  margin-top: 1.5rem;
}

.btn-manual:hover {
  border-color: #10b981;
  color: #10b981;
  background: #f9fafb;
}

:global(.dark) .btn-manual {
  background: #1f2937;
  border-color: #374151;
  color: #9ca3af;
}

:global(.dark) .btn-manual:hover {
  border-color: #34d399;
  color: #34d399;
  background: rgba(16, 185, 129, 0.1);
}

.btn-continue {
  width: 100%;
  padding: 1rem 2rem;
  background: #10b981;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  transition: all 200ms ease;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.btn-continue:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.btn-continue:active {
  transform: translateY(0);
}

.cursor-pointer {
  cursor: pointer;
}
</style>
