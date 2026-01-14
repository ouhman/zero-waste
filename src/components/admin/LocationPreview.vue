<template>
  <div class="space-y-4">
    <!-- Map Preview -->
    <div v-if="location.latitude && location.longitude" class="rounded-lg overflow-hidden border border-gray-200">
      <div id="preview-map" class="h-48"></div>
    </div>

    <!-- Info Card -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <h3 class="text-xl font-bold text-gray-900 mb-2">
        {{ location.name || t('common.loading') }}
      </h3>

      <!-- Address -->
      <div v-if="location.address" class="flex items-start gap-2 text-sm text-gray-600 mb-3">
        <svg class="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{{ location.address }}, {{ location.city }}</span>
      </div>

      <!-- Description -->
      <div v-if="location.description_de || location.description_en" class="mb-4">
        <p class="text-sm text-gray-700">
          {{ location.description_de || location.description_en }}
        </p>
      </div>

      <!-- Categories -->
      <div v-if="displayCategories.length > 0" class="flex flex-wrap gap-2 mb-4">
        <span
          v-for="category in displayCategories"
          :key="category.id"
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
        >
          {{ category.name_de }}
        </span>
      </div>

      <!-- Contact Info -->
      <ContactInfo
        :phone="location.phone"
        :website="location.website"
        :email="location.email"
        :instagram="location.instagram"
        size="compact"
        icon-style="svg"
        :disable-interaction="true"
      />

      <!-- Payment Methods -->
      <div v-if="hasPaymentMethods" class="mt-4 pt-4 border-t border-gray-200">
        <p class="text-xs font-medium text-gray-500 uppercase mb-2">Payment Methods</p>
        <PaymentMethodsBadges
          :payment-methods="location.payment_methods as PaymentMethodsType"
          layout="wrap"
          size="small"
        />
      </div>

      <!-- Opening Hours -->
      <div v-if="location.opening_hours_osm" class="mt-4 pt-4 border-t border-gray-200">
        <p class="text-xs font-medium text-gray-500 uppercase mb-2">{{ t('location.openingHours') }}</p>
        <p class="text-sm text-gray-700 font-mono">{{ location.opening_hours_osm }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import ContactInfo from '@/components/common/ContactInfo.vue'
import PaymentMethodsBadges from '@/components/common/PaymentMethodsBadges.vue'
import type { Database } from '@/types/database'
import type { PaymentMethods as PaymentMethodsType } from '@/types/osm'

type Location = Database['public']['Tables']['locations']['Row']
type Category = Database['public']['Tables']['categories']['Row']

interface Props {
  location: Partial<Location>
  categories?: Category[]
}

const props = withDefaults(defineProps<Props>(), {
  categories: () => []
})

const { t } = useI18n()

let previewMap: L.Map | null = null
let previewMarker: L.Marker | null = null
const isGeocoding = ref(false)

const hasPaymentMethods = computed(() => {
  const pm = props.location.payment_methods as PaymentMethodsType | null | undefined
  if (!pm) return false
  return Object.values(pm).some(v => v === true)
})

const displayCategories = computed(() => {
  // This would need to be populated from the parent
  return props.categories
})

async function geocodeAddress(): Promise<{ lat: number; lng: number } | null> {
  const address = props.location.address
  const postalCode = props.location.postal_code
  const city = props.location.city

  if (!address || !city) return null

  try {
    const fullAddress = `${address}, ${postalCode || ''} ${city}`.trim()
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`,
      {
        headers: {
          'User-Agent': 'ZeroWasteFrankfurt/1.0'
        }
      }
    )
    const data = await response.json()
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
    }
  } catch (e) {
    console.warn('Geocoding failed:', e)
  }
  return null
}

async function initPreviewMap() {
  // Default to stored coordinates as fallback
  let lat = parseFloat(props.location.latitude as string) || 50.1109
  let lng = parseFloat(props.location.longitude as string) || 8.6821

  // Try to geocode from address for more accurate location
  isGeocoding.value = true
  const geocoded = await geocodeAddress()
  isGeocoding.value = false

  if (geocoded) {
    lat = geocoded.lat
    lng = geocoded.lng
  }

  previewMap = L.map('preview-map', {
    dragging: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    zoomControl: false
  }).setView([lat, lng], 17)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(previewMap)

  previewMarker = L.marker([lat, lng]).addTo(previewMap)
}

// Watch for address changes and re-geocode
watch(
  () => [props.location.address, props.location.postal_code, props.location.city],
  async () => {
    if (previewMarker && previewMap) {
      const geocoded = await geocodeAddress()
      if (geocoded) {
        previewMarker.setLatLng([geocoded.lat, geocoded.lng])
        previewMap.setView([geocoded.lat, geocoded.lng], 17)
      }
    }
  }
)

onMounted(() => {
  setTimeout(() => {
    if (props.location.address && props.location.city) {
      initPreviewMap()
    } else if (props.location.latitude && props.location.longitude) {
      // Fallback to coordinates if no address
      initPreviewMap()
    }
  }, 100)
})

onUnmounted(() => {
  if (previewMap) {
    previewMap.remove()
    previewMap = null
  }
})
</script>
