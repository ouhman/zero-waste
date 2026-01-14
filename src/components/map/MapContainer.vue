<template>
  <div class="map-container" ref="mapElement"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Database } from '@/types/database'
import { getCategoryIcon } from '@/lib/markerIcons'
import { generatePopupHTML } from './PopupCard'

type Location = Database['public']['Tables']['locations']['Row'] & {
  location_categories?: {
    categories: Database['public']['Tables']['categories']['Row']
  }[]
}

interface Props {
  locations?: Location[]
  centerLat?: number
  centerLng?: number
}

const props = withDefaults(defineProps<Props>(), {
  locations: () => [],
  centerLat: 50.1109, // Frankfurt center
  centerLng: 8.6821
})

const emit = defineEmits<{
  'show-details': [locationId: string]
  'share-location': [locationId: string]
}>()

const DEFAULT_ZOOM = 13

const mapElement = ref<HTMLElement | null>(null)
let map: L.Map | null = null
const markers: L.Marker[] = []
const markerMap = new Map<string, L.Marker>() // locationId -> marker
let highlightedMarkerId: string | null = null

function initializeMap() {
  if (!mapElement.value || map) return

  // Create map with zoom control in bottom right (Google Maps style)
  map = L.map(mapElement.value, {
    zoomControl: false
  }).setView([props.centerLat, props.centerLng], DEFAULT_ZOOM)

  // Add zoom control to bottom right
  L.control.zoom({ position: 'bottomright' }).addTo(map)

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map)

  // Handle clicks on details and share buttons in popups
  map.on('popupopen', () => {
    // Wait for DOM to update, then attach click handlers
    setTimeout(() => {
      const detailButtons = document.querySelectorAll('.location-details-btn')
      detailButtons.forEach(btn => {
        btn.addEventListener('click', handleDetailsClick)
      })
      const shareButtons = document.querySelectorAll('.location-share-btn')
      shareButtons.forEach(btn => {
        btn.addEventListener('click', handleShareClick)
      })
    }, 0)
  })

  // Add markers after map is ready
  addMarkers()
}

function handleDetailsClick(e: Event) {
  const btn = e.currentTarget as HTMLElement
  const locationId = btn.dataset.locationId
  if (locationId) {
    emit('show-details', locationId)
    // Close the popup
    map?.closePopup()
  }
}

function handleShareClick(e: Event) {
  const btn = e.currentTarget as HTMLElement
  const locationId = btn.dataset.locationId
  if (locationId) {
    emit('share-location', locationId)
    // Close the popup
    map?.closePopup()
  }
}

function addMarkers() {
  if (!map) return

  // Clear existing markers
  markers.forEach(marker => marker.remove())
  markers.length = 0
  markerMap.clear()
  highlightedMarkerId = null

  // Add markers for each location
  props.locations.forEach(location => {
    const lat = parseFloat(location.latitude)
    const lng = parseFloat(location.longitude)

    if (isNaN(lat) || isNaN(lng)) return

    // Get primary category for icon
    const primaryCategorySlug = location.location_categories?.[0]?.categories?.slug || null
    const icon = getCategoryIcon(primaryCategorySlug)

    const marker = L.marker([lat, lng], { icon }).addTo(map!)

    // Generate popup HTML using shared utility
    const popupContent = generatePopupHTML(location, {
      showDetailsButton: true,
      showShareButton: true,
      showDirectionsButton: true
    })

    marker.bindPopup(popupContent, { maxWidth: 320 })
    markers.push(marker)
    markerMap.set(location.id, marker)
  })
}

// Watch locations and update markers when they change
watch(() => props.locations, () => {
  addMarkers()
}, { deep: true })

// Method to center map on a location (can be called externally)
function centerOn(lat: number, lng: number, zoom?: number) {
  if (map) {
    map.setView([lat, lng], zoom ?? DEFAULT_ZOOM)
  }
}

// Method to focus on a location: center, zoom, and open popup
function focusLocation(locationId: string, zoom: number = 17) {
  const location = props.locations.find(l => l.id === locationId)
  if (!location || !map) return

  const lat = parseFloat(location.latitude)
  const lng = parseFloat(location.longitude)
  if (isNaN(lat) || isNaN(lng)) return

  // Find the marker for this location
  const markerIndex = props.locations.findIndex(l => l.id === locationId)
  const marker = markers[markerIndex]

  // Center and zoom
  map.setView([lat, lng], zoom)

  // Open popup after a short delay to let the map animate
  if (marker) {
    setTimeout(() => marker.openPopup(), 300)
  }
}

// Highlight/unhighlight a marker
function highlightMarker(locationId: string | null) {
  // Remove highlight from previous marker
  if (highlightedMarkerId) {
    const prevMarker = markerMap.get(highlightedMarkerId)
    if (prevMarker) {
      const el = prevMarker.getElement() as HTMLElement | undefined
      if (el) {
        el.classList.remove('marker-highlighted')
        el.style.zIndex = '' // Reset to let Leaflet manage it
      }
    }
  }

  // Add highlight to new marker
  if (locationId) {
    const marker = markerMap.get(locationId)
    if (marker) {
      const el = marker.getElement() as HTMLElement | undefined
      if (el) {
        el.classList.add('marker-highlighted')
        el.style.zIndex = '10000' // Force above all other markers
      }
    }
  }

  highlightedMarkerId = locationId
}

// Ensure a location is visible on the map (pan only if outside current view)
function ensureVisible(lat: number, lng: number) {
  if (!map) return

  const bounds = map.getBounds()
  const point = L.latLng(lat, lng)

  if (!bounds.contains(point)) {
    // Pan to include the point, keeping it roughly centered
    map.panTo(point)
  }
}

// Watch center changes and update map view
watch(
  () => ({ lat: props.centerLat, lng: props.centerLng }),
  (newCenter, oldCenter) => {
    if (map && (newCenter.lat !== oldCenter?.lat || newCenter.lng !== oldCenter?.lng)) {
      map.setView([newCenter.lat, newCenter.lng], DEFAULT_ZOOM)
    }
  },
  { deep: true }
)

// Expose methods for parent components
defineExpose({ centerOn, focusLocation, highlightMarker, ensureVisible })

onMounted(() => {
  initializeMap()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>

<style>
/* Zoom control positioning (Google Maps style - bottom right with padding) */
/* Move attribution to bottom-left to not interfere with zoom controls */
.leaflet-control-attribution {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: auto !important;
  margin: 0 !important;
}

/* Position zoom controls precisely in bottom-right */
.leaflet-bottom.leaflet-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  bottom: 1.625rem !important;  /* 26px on mobile - aligned with filter bar center */
  right: 1.25rem !important;   /* 20px on mobile - equal spacing with filter bar gap */
}

.leaflet-control-zoom {
  margin: 0 !important;
}

@media (min-width: 768px) {
  .leaflet-bottom.leaflet-right {
    bottom: 1.5rem !important;  /* 24px on desktop */
    right: 3.5rem !important;   /* 56px on desktop */
  }
}

/* Global styles for marker highlighting (Leaflet markers are outside Vue scope) */
.leaflet-marker-icon.marker-highlighted {
  z-index: 1000 !important;
  filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.8)) drop-shadow(0 0 16px rgba(16, 185, 129, 0.4));
  /* Scale via width/height since transform is used by Leaflet for positioning */
  width: 50px !important;
  height: 50px !important;
  margin-left: -25px !important;
  margin-top: -50px !important;
  transition: filter 0.2s ease, width 0.2s ease, height 0.2s ease, margin 0.2s ease;
}
</style>
