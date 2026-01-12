<template>
  <div class="location-pin-map">
    <!-- Back button -->
    <button
      type="button"
      class="btn-back cursor-pointer"
      @click="emit('back')"
      :aria-label="t('submit.back')"
    >
      ← {{ t('submit.back') }}
    </button>

    <!-- Search bar -->
    <div class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        :placeholder="t('submit.searchAddress')"
        @input="handleSearchInput"
      />
      <button
        type="button"
        class="btn-geolocation cursor-pointer"
        :class="{ loading: geolocationLoading }"
        :disabled="geolocationLoading"
        @click="handleGeolocationClick"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="icon"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
          />
        </svg>
        <span class="btn-text">{{ geolocationLoading ? t('submit.locatingYou') : t('submit.iAmNearby') }}</span>
      </button>
    </div>

    <!-- Error message -->
    <div v-if="errorMessage" class="error-message" role="alert">
      {{ errorMessage }}
    </div>

    <!-- Map container -->
    <div ref="mapElement" class="map-element"></div>

    <!-- Instruction text -->
    <p v-if="!markerPosition" class="instruction-text hint">
      {{ t('submit.tapToPlace') }}
    </p>
    <p v-else class="instruction-text">
      {{ t('submit.dragToAdjust') }}
    </p>

    <!-- Accuracy info (if available) -->
    <p v-if="accuracy" class="accuracy-info">
      {{ t('submit.accuracyInfo', { meters: Math.round(accuracy) }) }}
    </p>

    <!-- Selected address display -->
    <div v-if="selectedAddress" class="selected-address">
      <strong>{{ t('submit.selectedAddress', { address: selectedAddress }) }}</strong>
    </div>

    <!-- Confirm button -->
    <button
      v-if="markerPosition"
      type="button"
      class="btn-confirm cursor-pointer"
      @click="handleConfirm"
    >
      {{ t('submit.confirmLocation') }} ✓
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGeolocation } from '@/composables/useGeolocation'
import { useNominatim } from '@/composables/useNominatim'

interface Props {
  initialLocation?: {
    lat: number
    lng: number
    address: string
  } | null
}

const props = withDefaults(defineProps<Props>(), {
  initialLocation: null
})

const emit = defineEmits<{
  back: []
  'location-confirmed': [data: { lat: number; lng: number; address: string }]
}>()

const { t } = useI18n()

// Composables
const { getUserLocation, loading: geolocationLoading, error: geolocationError } = useGeolocation()
const { debouncedGeocode, reverseGeocode, result, reverseResult, error: geocodingError } = useNominatim()

// Watch for geocoding results (since debouncedGeocode is async/debounced)
watch(result, (newResult) => {
  if (newResult) {
    const { lat, lng, displayName } = newResult
    updateMarker(lat, lng)
    selectedAddress.value = displayName
    if (map) {
      map.setView([lat, lng], SEARCH_ZOOM)
    }
    accuracy.value = null
    if (accuracyCircle) {
      accuracyCircle.remove()
      accuracyCircle = null
    }
  }
})

// Watch for geocoding errors
watch(geocodingError, (newError) => {
  if (newError) {
    errorMessage.value = newError
  }
})

// State
const mapElement = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const markerPosition = ref<{ lat: number; lng: number } | null>(null)
const selectedAddress = ref('')
const accuracy = ref<number | null>(null)
const errorMessage = ref<string | null>(null)

// Map instance and marker
let map: L.Map | null = null
let marker: L.Marker | null = null
let accuracyCircle: L.Circle | null = null

// Frankfurt default center
const FRANKFURT_CENTER: [number, number] = [50.1109, 8.6821]
const DEFAULT_ZOOM = 12
const SEARCH_ZOOM = 15
const GEOLOCATION_ZOOM = 17

/**
 * Initialize Leaflet map
 */
function initializeMap() {
  if (!mapElement.value || map) return

  // Create map centered on Frankfurt
  map = L.map(mapElement.value).setView(FRANKFURT_CENTER, DEFAULT_ZOOM)

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map)

  // Handle map click to place marker
  map.on('click', handleMapClick)
}

// Minimum zoom level to see street names
const MIN_STREET_ZOOM = 15

/**
 * Handle click on map to place marker
 */
async function handleMapClick(e: L.LeafletMouseEvent) {
  const { lat, lng } = e.latlng

  // Clear accuracy circle from previous geolocation
  if (accuracyCircle) {
    accuracyCircle.remove()
    accuracyCircle = null
  }
  accuracy.value = null

  // Place marker at clicked position
  updateMarker(lat, lng)

  // Zoom in smoothly if current zoom is too low to see street names
  if (map && map.getZoom() < MIN_STREET_ZOOM) {
    map.flyTo([lat, lng], MIN_STREET_ZOOM, {
      duration: 0.8
    })
  }

  // Reverse geocode to get address
  await reverseGeocode(lat, lng)
  if (reverseResult.value) {
    selectedAddress.value = reverseResult.value.displayName
  }
}

/**
 * Create or update marker at position
 */
function updateMarker(lat: number, lng: number, draggable = true) {
  if (!map) return

  // Remove existing marker
  if (marker) {
    marker.remove()
  }

  // Create custom icon for draggable pin
  const pinIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
        <path fill="#10b981" stroke="#065f46" stroke-width="2" d="M16 0C7.163 0 0 7.163 0 16c0 13 16 26 16 26s16-13 16-26C32 7.163 24.837 0 16 0z"/>
        <circle fill="white" cx="16" cy="16" r="6"/>
      </svg>
    `),
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42]
  })

  // Create marker
  marker = L.marker([lat, lng], {
    icon: pinIcon,
    draggable
  }).addTo(map)

  // Handle drag end
  if (draggable) {
    marker.on('dragend', async () => {
      if (!marker) return
      const newPos = marker.getLatLng()
      markerPosition.value = { lat: newPos.lat, lng: newPos.lng }

      // Trigger reverse geocode to get address
      await reverseGeocode(newPos.lat, newPos.lng)
      if (reverseResult.value) {
        selectedAddress.value = reverseResult.value.displayName
      }
    })
  }

  // Update state
  markerPosition.value = { lat, lng }

  // Center map on marker
  map.setView([lat, lng], map.getZoom())
}

/**
 * Show accuracy circle for geolocation
 */
function showAccuracyCircle(lat: number, lng: number, accuracyMeters: number) {
  if (!map) return

  // Remove existing circle
  if (accuracyCircle) {
    accuracyCircle.remove()
  }

  // Create accuracy circle
  accuracyCircle = L.circle([lat, lng], {
    radius: accuracyMeters,
    color: '#10b981',
    fillColor: '#10b981',
    fillOpacity: 0.1,
    weight: 2
  }).addTo(map)
}

/**
 * Handle search input (debounced geocoding)
 */
function handleSearchInput() {
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    errorMessage.value = null
    return
  }

  errorMessage.value = null
  // debouncedGeocode will trigger the watch(result) when complete
  debouncedGeocode(searchQuery.value)
}

/**
 * Handle "I am nearby" button click
 */
async function handleGeolocationClick() {
  errorMessage.value = null
  const location = await getUserLocation()

  if (location) {
    const { lat, lng, accuracy: acc } = location
    updateMarker(lat, lng)
    accuracy.value = acc
    showAccuracyCircle(lat, lng, acc)
    if (map) {
      map.setView([lat, lng], GEOLOCATION_ZOOM)
    }

    // Reverse geocode to get address
    await reverseGeocode(lat, lng)
    if (reverseResult.value) {
      selectedAddress.value = reverseResult.value.displayName
    }
  } else if (geolocationError.value) {
    errorMessage.value = geolocationError.value
  }
}

/**
 * Handle confirm button click
 */
function handleConfirm() {
  if (!markerPosition.value) return

  emit('location-confirmed', {
    lat: markerPosition.value.lat,
    lng: markerPosition.value.lng,
    address: selectedAddress.value
  })
}

onMounted(() => {
  initializeMap()

  // Restore initial location if provided (e.g., when going back from POI selector)
  if (props.initialLocation) {
    const { lat, lng, address } = props.initialLocation
    updateMarker(lat, lng)
    selectedAddress.value = address
    if (map) {
      map.setView([lat, lng], MIN_STREET_ZOOM)
    }
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
  marker = null
  accuracyCircle = null
})
</script>

<style scoped>
.location-pin-map {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.search-container {
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 200ms ease;
}

.search-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.btn-geolocation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 2px solid #10b981;
  border-radius: 8px;
  color: #10b981;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 200ms ease;
}

.btn-geolocation:hover:not(:disabled) {
  background: #ecfdf5;
  transform: translateY(-1px);
}

.btn-geolocation:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-geolocation.loading .icon {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.btn-geolocation .icon {
  width: 20px;
  height: 20px;
}

.btn-text {
  display: none;
}

@media (min-width: 640px) {
  .btn-text {
    display: inline;
  }
}

.error-message {
  padding: 0.75rem 1rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  color: #991b1b;
  font-size: 0.875rem;
}

.map-element {
  width: 100%;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .map-element {
    height: 500px;
  }
}

.instruction-text {
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.accuracy-info {
  text-align: center;
  color: #10b981;
  font-size: 0.8125rem;
  margin: 0;
  font-weight: 500;
}

.selected-address {
  padding: 0.75rem 1rem;
  background: #ecfdf5;
  border: 1px solid #d1fae5;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #065f46;
  text-align: center;
}

.btn-confirm {
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

.btn-confirm:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.btn-confirm:active {
  transform: translateY(0);
}

.cursor-pointer {
  cursor: pointer;
}
</style>
