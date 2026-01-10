<template>
  <div class="w-full h-screen relative flex flex-col">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-8 py-2.5 sm:py-3 md:py-4 shadow-sm z-[1000]">
      <div class="flex justify-between items-center gap-3 max-w-7xl mx-auto">
        <h1 class="text-base sm:text-lg md:text-2xl font-bold text-gray-900 truncate">{{ t('map.title') }}</h1>
        <div class="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
          <router-link
            to="/submit"
            class="px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 bg-green-500 text-white rounded-lg font-semibold text-xs sm:text-sm hover:bg-green-600 transition-colors whitespace-nowrap"
          >
            <span class="hidden sm:inline">+ {{ t('map.submitLocation') }}</span>
            <span class="sm:hidden">+ {{ t('map.submitLocationShort') }}</span>
          </router-link>
          <LanguageSwitcher />
        </div>
      </div>
    </div>

    <!-- Desktop Controls Panel (top-left) -->
    <div class="hidden md:flex absolute top-24 lg:top-28 left-4 lg:left-8 w-64 lg:w-80 max-h-[calc(100vh-8rem)] overflow-y-auto z-[1000] flex-col gap-3 lg:gap-4">
      <SearchBar @select="handleSearchSelect" />
      <CategoryFilter v-model:selectedCategories="selectedCategories" />
      <NearMeButton @locations-found="handleNearbyLocations" />
    </div>

    <!-- Mobile Controls Panel (bottom) -->
    <div class="md:hidden absolute bottom-3 left-3 right-3 z-[1000] bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col-reverse">
      <!-- Toggle Button -->
      <button
        @click="togglePanel"
        class="flex items-center gap-2.5 w-full px-4 py-3.5 text-sm font-semibold text-gray-800"
      >
        <svg class="w-5 h-5 text-gray-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd"/>
        </svg>
        <span class="flex-1 text-left">{{ t('filters.title') }}</span>
        <span
          v-if="selectedCategories.length > 0"
          class="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 bg-green-600 text-white text-xs font-semibold rounded-full"
        >
          {{ selectedCategories.length }}
        </span>
        <svg
          :class="['w-4 h-4 text-gray-400 transition-transform duration-200', isPanelCollapsed ? 'rotate-180' : '']"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Panel Content -->
      <div
        v-show="!isPanelCollapsed"
        class="px-3 pb-3 pt-2 flex flex-col gap-3 border-b border-gray-100"
      >
        <SearchBar @select="handleSearchSelect" />
        <CategoryFilter v-model:selectedCategories="selectedCategories" />
      </div>
    </div>

    <!-- Mobile Floating NearMe Button (top-right on map) -->
    <div class="md:hidden absolute top-16 right-3 z-[1000]">
      <NearMeButton compact @locations-found="handleNearbyLocations" />
    </div>

    <!-- Map -->
    <MapContainer
      ref="mapRef"
      :locations="filteredLocations"
      :center-lat="mapCenter.lat"
      :center-lng="mapCenter.lng"
      class="flex-1"
      @show-details="handleShowDetails"
    />

    <!-- Location Detail Panel -->
    <LocationDetailPanel
      :location="selectedLocation"
      @close="handleClosePanel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import MapContainer from '@/components/map/MapContainer.vue'
import SearchBar from '@/components/SearchBar.vue'
import CategoryFilter from '@/components/CategoryFilter.vue'
import NearMeButton from '@/components/NearMeButton.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import LocationDetailPanel from '@/components/LocationDetailPanel.vue'
import { useLocations } from '@/composables/useLocations'
import { useFilters } from '@/composables/useFilters'
import { useSeo } from '@/composables/useSeo'
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row']
type LocationWithCategories = Location & {
  location_categories?: {
    categories: Database['public']['Tables']['categories']['Row']
  }[]
}

const { t } = useI18n()
const { locations, fetchLocations } = useLocations()
const { filterByCategories } = useFilters()

// SEO
useSeo({
  title: 'Zero Waste Frankfurt - Nachhaltig einkaufen',
  description: 'Entdecke nachhaltige Geschäfte, Unverpackt-Läden und Zero-Waste-Locations in Frankfurt. Interaktive Karte mit allen nachhaltigen Einkaufsmöglichkeiten.'
})

const selectedCategories = ref<string[]>([])
const mapCenter = ref({ lat: 50.1109, lng: 8.6821 }) // Frankfurt center
const mapRef = ref<InstanceType<typeof MapContainer> | null>(null)
const selectedLocation = ref<LocationWithCategories | null>(null)

// Panel collapse state - collapsed by default on mobile
const isPanelCollapsed = ref(true)

function togglePanel() {
  isPanelCollapsed.value = !isPanelCollapsed.value
}

const filteredLocations = computed(() => {
  return filterByCategories(locations.value, selectedCategories.value)
})

onMounted(async () => {
  await fetchLocations()
})

function handleSearchSelect(location: Location) {
  // Focus on selected location (center, zoom, open popup)
  mapRef.value?.focusLocation(location.id)
}

function handleNearbyLocations(_nearbyLocs: any[], userLat: number, userLng: number) {
  // Center map on user location
  mapRef.value?.centerOn(userLat, userLng)
  mapCenter.value = { lat: userLat, lng: userLng }
}

function handleShowDetails(locationId: string) {
  const location = filteredLocations.value.find(l => l.id === locationId)
  if (location) {
    selectedLocation.value = location as LocationWithCategories
    mapRef.value?.highlightMarker(locationId)
  }
}

function handleClosePanel() {
  mapRef.value?.highlightMarker(null)
  selectedLocation.value = null
}
</script>
