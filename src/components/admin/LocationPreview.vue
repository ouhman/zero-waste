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
      <div class="space-y-2 text-sm">
        <div v-if="location.phone" class="flex items-center gap-2">
          <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span class="text-gray-700">{{ location.phone }}</span>
        </div>

        <div v-if="location.website" class="flex items-center gap-2">
          <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <a :href="location.website" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">
            {{ location.website }}
          </a>
        </div>

        <div v-if="location.email" class="flex items-center gap-2">
          <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <a :href="`mailto:${location.email}`" class="text-blue-600 hover:underline">
            {{ location.email }}
          </a>
        </div>

        <div v-if="location.instagram" class="flex items-center gap-2">
          <svg class="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <a :href="`https://instagram.com/${location.instagram?.replace('@', '')}`" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">
            {{ location.instagram }}
          </a>
        </div>
      </div>

      <!-- Payment Methods -->
      <div v-if="hasPaymentMethods" class="mt-4 pt-4 border-t border-gray-200">
        <p class="text-xs font-medium text-gray-500 uppercase mb-2">Payment Methods</p>
        <div class="flex flex-wrap gap-2">
          <span v-if="paymentMethods.cash" class="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
            💵 Cash
          </span>
          <span v-if="paymentMethods.credit_card" class="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
            💳 Credit Card
          </span>
          <span v-if="paymentMethods.debit_card" class="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
            💳 Debit Card
          </span>
          <span v-if="paymentMethods.contactless" class="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
            📱 Contactless
          </span>
          <span v-if="paymentMethods.mobile" class="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
            📱 Apple/Google Pay
          </span>
        </div>
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
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Database } from '@/types/database'

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

const paymentMethods = computed(() => {
  const pm = props.location.payment_methods as any
  return {
    cash: pm?.cash || false,
    credit_card: pm?.credit_card || false,
    debit_card: pm?.debit_card || false,
    contactless: pm?.contactless || false,
    mobile: pm?.mobile || false
  }
})

const hasPaymentMethods = computed(() => {
  return Object.values(paymentMethods.value).some(v => v)
})

const displayCategories = computed(() => {
  // This would need to be populated from the parent
  return props.categories
})

function initPreviewMap() {
  const lat = parseFloat(props.location.latitude as string) || 50.1109
  const lng = parseFloat(props.location.longitude as string) || 8.6821

  previewMap = L.map('preview-map', {
    dragging: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    zoomControl: false
  }).setView([lat, lng], 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(previewMap)

  previewMarker = L.marker([lat, lng]).addTo(previewMap)
}

watch(() => [props.location.latitude, props.location.longitude], ([lat, lng]) => {
  if (lat && lng && previewMarker && previewMap) {
    const latNum = parseFloat(lat as string)
    const lngNum = parseFloat(lng as string)
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      previewMarker.setLatLng([latNum, lngNum])
      previewMap.setView([latNum, lngNum])
    }
  }
})

onMounted(() => {
  setTimeout(() => {
    if (props.location.latitude && props.location.longitude) {
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
