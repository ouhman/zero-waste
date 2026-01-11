<template>
  <div class="map-container" ref="mapElement"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Database } from '@/types/database'
import type { PaymentMethods } from '@/types/osm'
import { PAYMENT_METHOD_ICONS } from '@/types/osm'
import { getCategoryIcon } from '@/lib/markerIcons'

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

  // Create map
  map = L.map(mapElement.value).setView([props.centerLat, props.centerLng], DEFAULT_ZOOM)

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

// Helper function to generate payment methods HTML for popup
function formatPaymentMethods(paymentMethods: any): string {
  if (!paymentMethods || typeof paymentMethods !== 'object') return ''

  const enabledMethods: Array<{ icon: string; key: string }> = []

  // Priority order for display (most common first)
  const priorityOrder: (keyof PaymentMethods)[] = [
    'cash',
    'debit_cards',
    'credit_cards',
    'contactless'
  ]

  for (const key of priorityOrder) {
    if (paymentMethods[key]) {
      enabledMethods.push({
        key,
        icon: PAYMENT_METHOD_ICONS[key]
      })
    }
  }

  if (enabledMethods.length === 0) return ''

  const iconsHtml = enabledMethods.map(method =>
    `<span style="display: inline-block; margin-right: 4px;">${method.icon}</span>`
  ).join('')

  return `
    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; color: #64748b; font-size: 13px;">
      ${iconsHtml}
    </div>
  `
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

    // Get categories for this location
    const categories = location.location_categories
      ?.map(lc => lc.categories?.name_de)
      .filter(Boolean) || []

    // Build popup content with more info
    const popupContent = `
      <div style="min-width: 250px; max-width: 300px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1e293b;">
          ${location.name}
        </h3>

        ${categories.length > 0 ? `
          <div style="margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 4px;">
            ${categories.map(cat => `
              <span style="
                display: inline-block;
                padding: 2px 8px;
                background: #f0fdf4;
                color: #15803d;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
              ">${cat}</span>
            `).join('')}
          </div>
        ` : ''}

        <div style="display: flex; align-items: start; gap: 6px; margin-bottom: 8px; color: #64748b; font-size: 13px;">
          <span>📍</span>
          <span>${location.address}${location.postal_code ? `, ${location.postal_code}` : ''} ${location.city || 'Frankfurt'}</span>
        </div>

        ${location.opening_hours_text ? `
          <div style="display: flex; align-items: start; gap: 6px; margin-bottom: 8px; color: #64748b; font-size: 13px;">
            <span>🕐</span>
            <span>${location.opening_hours_text}</span>
          </div>
        ` : ''}

        ${formatPaymentMethods(location.payment_methods)}

        ${location.website ? `
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 13px;">
            <span>🌐</span>
            <a href="${location.website}" target="_blank" rel="noopener" style="color: #2563eb; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${location.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          </div>
        ` : ''}

        ${location.phone ? `
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 13px;">
            <span>📞</span>
            <a href="tel:${location.phone}" style="color: #2563eb; text-decoration: none;">${location.phone}</a>
          </div>
        ` : ''}

        ${location.description_de ? `
          <p style="margin: 10px 0; font-size: 13px; color: #475569; line-height: 1.4;">
            ${location.description_de.length > 120 ? location.description_de.substring(0, 120) + '...' : location.description_de}
          </p>
        ` : ''}

        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; gap: 8px;">
          <button
            class="location-details-btn"
            data-location-id="${location.id}"
            style="
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
            "
          >
            Details →
          </button>
          <button
            class="location-share-btn"
            data-location-id="${location.id}"
            style="
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
            "
            title="Teilen"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </button>
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=bicycling"
            target="_blank"
            rel="noopener"
            style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 8px 12px;
              background: #f1f5f9;
              color: #475569;
              text-decoration: none;
              font-size: 13px;
              border-radius: 6px;
            "
            title="Route planen"
          >
            🚲
          </a>
        </div>
      </div>
    `

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
