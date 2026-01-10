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

  // Handle clicks on details buttons in popups
  map.on('popupopen', () => {
    // Wait for DOM to update, then attach click handlers
    setTimeout(() => {
      const buttons = document.querySelectorAll('.location-details-btn')
      buttons.forEach(btn => {
        btn.addEventListener('click', handleDetailsClick)
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

        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px;">
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
let pulseElement: HTMLElement | null = null

function highlightMarker(locationId: string | null) {
  // Remove highlight from previous marker
  if (highlightedMarkerId) {
    const prevMarker = markerMap.get(highlightedMarkerId)
    if (prevMarker) {
      const el = prevMarker.getElement()
      if (el) {
        el.classList.remove('marker-highlighted')
      }
    }
  }

  // Remove previous pulse element
  if (pulseElement) {
    pulseElement.remove()
    pulseElement = null
  }

  // Add highlight to new marker
  if (locationId) {
    const marker = markerMap.get(locationId)
    if (marker) {
      const el = marker.getElement()
      if (el) {
        el.classList.add('marker-highlighted')

        // Add pulse ring element
        const location = props.locations.find(l => l.id === locationId)
        if (location && map) {
          const lat = parseFloat(location.latitude)
          const lng = parseFloat(location.longitude)
          const point = map.latLngToContainerPoint([lat, lng])

          pulseElement = document.createElement('div')
          pulseElement.className = 'marker-pulse-ring'
          pulseElement.style.cssText = `
            position: absolute;
            left: ${point.x}px;
            top: ${point.y}px;
            width: 24px;
            height: 24px;
            margin-left: -12px;
            margin-top: -34px;
            pointer-events: none;
            z-index: 400;
          `

          const ring = document.createElement('div')
          ring.style.cssText = `
            width: 100%;
            height: 100%;
            background: rgba(16, 185, 129, 0.4);
            border-radius: 50%;
            animation: marker-pulse 1.5s ease-out infinite;
          `
          pulseElement.appendChild(ring)

          mapElement.value?.appendChild(pulseElement)

          // Update pulse position when map moves
          map.on('move', updatePulsePosition)
        }
      }
    }
  } else {
    // Remove move listener when unhighlighting
    map?.off('move', updatePulsePosition)
  }

  highlightedMarkerId = locationId
}

function updatePulsePosition() {
  if (!pulseElement || !highlightedMarkerId || !map) return

  const location = props.locations.find(l => l.id === highlightedMarkerId)
  if (location) {
    const lat = parseFloat(location.latitude)
    const lng = parseFloat(location.longitude)
    const point = map.latLngToContainerPoint([lat, lng])
    pulseElement.style.left = `${point.x}px`
    pulseElement.style.top = `${point.y}px`
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
defineExpose({ centerOn, focusLocation, highlightMarker })

onMounted(() => {
  initializeMap()
})

onUnmounted(() => {
  if (pulseElement) {
    pulseElement.remove()
    pulseElement = null
  }
  if (map) {
    map.off('move', updatePulsePosition)
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
  width: 44px !important;
  height: 44px !important;
  margin-left: -22px !important;
  margin-top: -44px !important;
  transition: filter 0.2s ease, width 0.2s ease, height 0.2s ease, margin 0.2s ease;
}

@keyframes marker-pulse {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(3);
    opacity: 0;
  }
}
</style>
