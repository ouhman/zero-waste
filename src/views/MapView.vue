<template>
  <div class="w-full h-screen relative flex flex-col">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-8 py-2.5 sm:py-3 md:py-4 shadow-sm z-[1000]">
      <div class="flex justify-between items-center gap-3 max-w-7xl mx-auto">
        <h1 class="text-base sm:text-lg md:text-2xl font-bold text-gray-900 truncate">{{ t('map.title') }}</h1>
        <div class="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
          <router-link
            to="/submit"
            class="px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 bg-green-500 text-white rounded-lg font-semibold text-xs sm:text-sm hover:bg-green-600 transition-colors whitespace-nowrap cursor-pointer"
          >
            <span class="hidden sm:inline">+ {{ t('map.submitLocation') }}</span>
            <span class="sm:hidden">+ {{ t('map.submitLocationShort') }}</span>
          </router-link>
          <LanguageSwitcher />
        </div>
      </div>
    </div>

    <!-- Desktop Controls Panel (top-left) -->
    <div class="hidden md:flex absolute top-24 lg:top-28 left-4 lg:left-8 w-64 lg:w-80 z-[1000] flex-col gap-3 lg:gap-4">
      <SearchBar @select="handleSearchSelect" />
      <CategoryFilter v-model:selectedCategories="selectedCategories" />
    </div>

    <!-- Mobile Controls Panel (bottom) -->
    <div class="md:hidden absolute bottom-8 left-4 right-20 z-[1000] bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col-reverse">
      <!-- Toggle Button -->
      <button
        @click="togglePanel"
        class="flex items-center gap-2.5 w-full px-4 py-3.5 text-sm font-semibold text-gray-800 cursor-pointer"
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

    <!-- NearMe Button (bottom-right, above zoom controls - Google Maps style) -->
    <!-- Desktop: 24px margin + 61px zoom height + 16px gap = 101px → bottom-[6.5rem] (104px) -->
    <!-- Mobile: above zoom controls with 20px gap, horizontally centered with +/- -->
    <div class="absolute bottom-28 md:bottom-[6.5rem] right-4 md:right-12 z-[1000]">
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
      @share-location="handleShareLocation"
    />

    <!-- Location Detail Panel -->
    <LocationDetailPanel
      :location="selectedLocation"
      @close="handleClosePanel"
      @share="handleShareFromPanel"
    />

    <!-- Share Modal -->
    <ShareModal
      :location="shareModalLocation"
      @close="shareModalLocation = null"
    />

    <!-- 404 Modal for non-existent locations -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showNotFound"
          class="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50"
          @click.self="handleCloseNotFound"
        >
          <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center">
            <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-gray-900 mb-2">{{ t('notFound.title') }}</h2>
            <p class="text-gray-600 mb-6">{{ t('notFound.locationMessage') }}</p>
            <button
              @click="handleCloseNotFound"
              class="w-full px-4 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
            >
              {{ t('notFound.backToMap') }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import MapContainer from '@/components/map/MapContainer.vue'
import SearchBar from '@/components/SearchBar.vue'
import CategoryFilter from '@/components/CategoryFilter.vue'
import NearMeButton from '@/components/NearMeButton.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import LocationDetailPanel from '@/components/LocationDetailPanel.vue'
import ShareModal from '@/components/ShareModal.vue'
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
const route = useRoute()
const router = useRouter()
const { locations, fetchLocations, getLocationBySlug } = useLocations()
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
const shareModalLocation = ref<LocationWithCategories | null>(null)
const showNotFound = ref(false)
const notFoundSlug = ref('')

// Track if this is the initial page load (for direct URL access)
const isInitialLoad = ref(true)

// Panel collapse state - collapsed by default on mobile
const isPanelCollapsed = ref(true)

function togglePanel() {
  isPanelCollapsed.value = !isPanelCollapsed.value
}

const filteredLocations = computed(() => {
  return filterByCategories(locations.value, selectedCategories.value)
})

// Handle opening location by slug
// centerMode: 'center' = center + zoom, 'ensure' = only pan if not visible, 'none' = don't move
async function openLocationBySlug(slug: string, centerMode: 'center' | 'ensure' | 'none' = 'center') {
  const location = getLocationBySlug(slug)
  if (location) {
    selectedLocation.value = location as LocationWithCategories
    await nextTick()
    const lat = parseFloat(location.latitude)
    const lng = parseFloat(location.longitude)
    if (!isNaN(lat) && !isNaN(lng)) {
      if (centerMode === 'center') {
        mapRef.value?.centerOn(lat, lng, 17)
      } else if (centerMode === 'ensure') {
        mapRef.value?.ensureVisible(lat, lng)
      }
      // 'none' = don't move the map
    }
    mapRef.value?.highlightMarker(location.id)
  } else {
    // Location not found - show 404 modal
    notFoundSlug.value = slug
    showNotFound.value = true
  }
}

// Watch for route changes (handles back/forward navigation)
watch(
  () => route.params.slug,
  async (newSlug) => {
    if (newSlug && typeof newSlug === 'string') {
      // Skip if this location is already selected (from marker click)
      if (selectedLocation.value?.slug === newSlug) {
        return
      }
      // Wait for locations to be loaded if needed
      if (locations.value.length === 0) {
        await fetchLocations()
      }
      // Back/forward navigation: only pan if marker is not visible
      openLocationBySlug(newSlug, 'ensure')
    } else {
      // No slug - close the panel
      selectedLocation.value = null
      mapRef.value?.highlightMarker(null)
      showNotFound.value = false
    }
  }
)

onMounted(async () => {
  await fetchLocations()

  // Check if we have a slug in the URL (direct landing)
  const slug = route.params.slug
  if (slug && typeof slug === 'string') {
    // Initial load: center + zoom on the location
    openLocationBySlug(slug, 'center')
  }

  // Mark initial load as complete
  isInitialLoad.value = false
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
    // Update URL to include the slug
    if (location.slug) {
      router.push({ name: 'location-detail', params: { slug: location.slug } })
    }
  }
}

function handleShareLocation(locationId: string) {
  const location = filteredLocations.value.find(l => l.id === locationId)
  if (location) {
    shareModalLocation.value = location as LocationWithCategories
  }
}

function handleShareFromPanel(location: LocationWithCategories) {
  shareModalLocation.value = location
}

function handleClosePanel() {
  mapRef.value?.highlightMarker(null)
  selectedLocation.value = null
  // Navigate to map route (removes slug from URL)
  if (route.name === 'location-detail') {
    router.push({ name: 'map' })
  }
}

function handleCloseNotFound() {
  showNotFound.value = false
  notFoundSlug.value = ''
  router.push({ name: 'map' })
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
