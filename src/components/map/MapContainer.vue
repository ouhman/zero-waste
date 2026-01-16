<template>
  <div class="map-container" ref="mapElement"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Database } from '@/types/database'
import { getCategoryIcon, getDynamicMarkerIcon } from '@/lib/markerIcons'
import { generatePopupHTML } from './PopupCard'
import { useAnalytics } from '@/composables/useAnalytics'
import { useDarkMode } from '@/composables/useDarkMode'

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
  'popup-opened': [locationId: string]
  'popup-closed': [locationId: string]
  'markers-added': []
}>()

const DEFAULT_ZOOM = 13

const mapElement = ref<HTMLElement | null>(null)
let map: L.Map | null = null
const markers: L.Marker[] = []
const markerMap = new Map<string, L.Marker>() // locationId -> marker
let highlightedMarkerId: string | null = null
const { trackMapRendered } = useAnalytics()
const { isDark } = useDarkMode()
let mapTracked = false
let currentTileLayer: L.TileLayer | null = null

// Tile layer configurations
const JAWG_TOKEN = import.meta.env.VITE_JAWG_ACCESS_TOKEN
const TILE_CONFIGS = {
  light: JAWG_TOKEN
    ? {
        url: `https://tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=${JAWG_TOKEN}`,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://jawg.io">Jawg</a>',
        options: { maxZoom: 22 }
      }
    : {
        // Fallback to CartoDB Voyager if no Jawg token
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        options: { maxZoom: 20, subdomains: 'abcd' }
      },
  dark: JAWG_TOKEN
    ? {
        url: `https://tile.jawg.io/jawg-matrix/{z}/{x}/{y}{r}.png?access-token=${JAWG_TOKEN}`,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://jawg.io">Jawg</a>',
        options: { maxZoom: 22 }
      }
    : {
        // Fallback to CartoDB dark if no Jawg token
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        options: { maxZoom: 19, subdomains: 'abcd' }
      }
}

function setTileLayer(dark: boolean) {
  if (!map) return

  // Remove current tile layer
  if (currentTileLayer) {
    map.removeLayer(currentTileLayer)
  }

  // Add new tile layer
  const config = dark ? TILE_CONFIGS.dark : TILE_CONFIGS.light
  currentTileLayer = L.tileLayer(config.url, {
    attribution: config.attribution,
    ...config.options
  }).addTo(map)
}

function initializeMap() {
  if (!mapElement.value || map) return

  // Create map with zoom control in bottom right (Google Maps style)
  map = L.map(mapElement.value, {
    zoomControl: false
  }).setView([props.centerLat, props.centerLng], DEFAULT_ZOOM)

  // Add zoom control to bottom right
  L.control.zoom({ position: 'bottomright' }).addTo(map)

  // Add tile layer based on current dark mode state
  setTileLayer(isDark.value)

  // Handle clicks on details and share buttons in popups
  map.on('popupopen', (e: L.PopupEvent) => {
    // Highlight the marker immediately when popup opens
    const marker = (e.popup as unknown as { _source?: L.Marker })._source
    if (marker) {
      const locationId = getLocationIdByMarker(marker)
      if (locationId) {
        highlightMarker(locationId)
        emit('popup-opened', locationId)
      }
    }

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

  // Handle popup close - emit event for parent to decide whether to unhighlight
  map.on('popupclose', (e: L.PopupEvent) => {
    const marker = (e.popup as unknown as { _source?: L.Marker })._source
    if (marker) {
      const locationId = getLocationIdByMarker(marker)
      if (locationId) {
        emit('popup-closed', locationId)
      }
    }
  })

  // Add markers after map is ready
  addMarkers()

  // Track map rendered (only once)
  if (!mapTracked) {
    trackMapRendered()
    mapTracked = true
  }
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

// Get locationId for a marker (reverse lookup)
function getLocationIdByMarker(marker: L.Marker): string | undefined {
  for (const [id, m] of markerMap.entries()) {
    if (m === marker) return id
  }
  return undefined
}

async function addMarkers() {
  if (!map) return

  // Clear existing markers
  markers.forEach(marker => marker.remove())
  markers.length = 0
  markerMap.clear()
  highlightedMarkerId = null
  categoryHighlightedIds.clear()

  // Add markers for each location
  for (const location of props.locations) {
    const lat = parseFloat(location.latitude)
    const lng = parseFloat(location.longitude)

    if (isNaN(lat) || isNaN(lng)) continue

    // Get primary category for icon
    const primaryCategory = location.location_categories?.[0]?.categories

    // Choose icon strategy: dynamic markers (icon_name) or legacy (PNG)
    let icon: L.Icon | L.DivIcon
    if (primaryCategory?.icon_name) {
      // Use new dynamic marker system
      icon = await getDynamicMarkerIcon(primaryCategory)
    } else {
      // Fallback to legacy PNG icons
      icon = getCategoryIcon(primaryCategory?.slug || null, primaryCategory?.icon_url)
    }

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
  }

  // Notify parent that markers are ready
  emit('markers-added')
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

// Highlight/unhighlight a marker (for individual selection)
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

// Track which markers are highlighted due to category filter
let categoryHighlightedIds: Set<string> = new Set()

// Highlight all markers (for category filter)
function highlightAllMarkers() {
  markerMap.forEach((marker, locationId) => {
    const el = marker.getElement() as HTMLElement | undefined
    if (el) {
      el.classList.add('marker-highlighted')
      categoryHighlightedIds.add(locationId)
    }
  })
}

// Unhighlight all category-filtered markers (but keep individual selection)
function unhighlightAllMarkers() {
  categoryHighlightedIds.forEach(locationId => {
    // Don't unhighlight if it's the individually selected marker
    if (locationId === highlightedMarkerId) return

    const marker = markerMap.get(locationId)
    if (marker) {
      const el = marker.getElement() as HTMLElement | undefined
      if (el) {
        el.classList.remove('marker-highlighted')
        el.style.zIndex = ''
      }
    }
  })
  categoryHighlightedIds.clear()
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

// Watch dark mode changes and swap tile layer
watch(isDark, (dark) => {
  setTileLayer(dark)
})

// Expose methods for parent components
defineExpose({ centerOn, focusLocation, highlightMarker, highlightAllMarkers, unhighlightAllMarkers, ensureVisible })

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
/* PNG markers (L.Icon) - NOT dynamic markers */
.leaflet-marker-icon.marker-highlighted:not(.dynamic-marker) {
  z-index: 1000 !important;
  /* Scale via width/height since transform is used by Leaflet for positioning */
  width: 50px !important;
  height: 50px !important;
  margin-left: -25px !important;
  margin-top: -50px !important;
  transition: width 0.2s ease, height 0.2s ease, margin 0.2s ease;
}

/* Dynamic marker (DivIcon) styling */
.dynamic-marker {
  background: transparent !important;
  border: none !important;
}

/* Highlighted dynamic markers (DivIcon with SVG) */
.leaflet-marker-icon.dynamic-marker.marker-highlighted {
  z-index: 1000 !important;
  transition: transform 0.2s ease;
}

/* Scale the SVG inside the dynamic marker (direct child only to avoid nested SVG double-scaling) */
.leaflet-marker-icon.dynamic-marker.marker-highlighted > svg {
  transform: scale(1.4);
  transform-origin: center center;
  transition: transform 0.2s ease;
}

/* ==================== Popup Card Styles ==================== */
.leaflet-popup-content-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.dark .leaflet-popup-content-wrapper {
  background: #1f2937;
}

.leaflet-popup-tip {
  background: white;
}

.dark .leaflet-popup-tip {
  background: #1f2937;
}

.leaflet-popup-close-button {
  color: #6b7280 !important;
}

.dark .leaflet-popup-close-button {
  color: #9ca3af !important;
}

.popup-card {
  min-width: 250px;
  max-width: 300px;
}

.popup-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.dark .popup-title {
  color: #f3f4f6;
}

.popup-info-row {
  display: flex;
  align-items: start;
  gap: 6px;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 13px;
}

.dark .popup-info-row {
  color: #9ca3af;
}

.popup-description {
  margin: 10px 0;
  font-size: 13px;
  color: #475569;
  line-height: 1.4;
}

.dark .popup-description {
  color: #d1d5db;
}

.popup-actions {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 8px;
}

.dark .popup-actions {
  border-top-color: #374151;
}

.popup-btn-primary {
  flex: 1;
  display: inline-block;
  padding: 8px 12px;
  background: #10b981;
  color: white;
  border: none;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
}

.popup-btn-primary:hover {
  background: #059669;
}

.popup-btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  background: #f1f5f9;
  color: #475569;
  border: none;
  font-size: 13px;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
}

.dark .popup-btn-secondary {
  background: #374151;
  color: #d1d5db;
}

.popup-btn-secondary:hover {
  background: #e2e8f0;
}

.dark .popup-btn-secondary:hover {
  background: #4b5563;
}

/* Category badges in popup - update existing inline styles */
.popup-card span[style*="background: #f0fdf4"] {
  background: #f0fdf4 !important;
}

.dark .popup-card span[style*="background: #f0fdf4"] {
  background: rgba(6, 78, 59, 0.4) !important;
  color: #34d399 !important;
}

/* Links in popup */
.popup-card a {
  color: #2563eb;
}

.dark .popup-card a {
  color: #60a5fa;
}
</style>
