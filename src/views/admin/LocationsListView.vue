<template>
  <AdminLayout>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('admin.locations.title') }}</h1>
    </div>

    <!-- Category filter banner -->
    <div v-if="selectedCategory" class="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img
          :src="selectedCategory.icon_url || `/icons/categories/${selectedCategory.slug}.png`"
          :alt="selectedCategory.name_en"
          class="h-6 w-6"
        />
        <span class="text-sm text-blue-800">
          {{ t('admin.locations.filteringByCategory') }}: <strong>{{ selectedCategory.name_de }}</strong>
        </span>
      </div>
      <button
        @click="clearCategoryFilter"
        class="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
      >
        {{ t('admin.locations.clearFilter') }}
      </button>
    </div>

    <!-- Tabs -->
    <div class="mb-6">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            @click="activeTab = tab.value"
            :class="[
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer',
              activeTab === tab.value
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            {{ tab.label }}
            <span
              v-if="tab.count > 0"
              :class="[
                'ml-2 py-0.5 px-2 rounded-full text-xs',
                activeTab === tab.value
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
              ]"
            >
              {{ tab.count }}
            </span>
          </button>
        </nav>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('admin.locations.search')"
        class="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-600">{{ t('common.loading') }}...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md" role="alert">
      <p>{{ error }}</p>
    </div>

    <!-- Locations table -->
    <div v-else-if="filteredLocations.length > 0" class="bg-white shadow rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ t('admin.locations.table.name') }}
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ t('admin.locations.table.status') }}
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ t('admin.locations.table.created') }}
            </th>
            <th scope="col" class="relative px-6 py-3">
              <span class="sr-only">{{ t('admin.locations.table.actions') }}</span>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="location in filteredLocations" :key="location.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ location.name }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ location.city }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="[
                  'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                  location.status === 'approved' ? 'bg-green-100 text-green-800' :
                  location.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                ]"
              >
                {{ getStatusLabel(location.status) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(location.created_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              <button
                v-if="location.status === 'pending'"
                @click="handleApprove(location.id)"
                class="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 cursor-pointer"
              >
                {{ t('admin.approve') }}
              </button>
              <router-link
                :to="`/bulk-station/edit/${location.id}`"
                class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 cursor-pointer inline-block"
              >
                {{ t('admin.editButton') }}
              </router-link>
              <a
                v-if="location.slug && location.status === 'approved'"
                :href="`/location/${location.slug}`"
                target="_blank"
                class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 cursor-pointer inline-block"
              >
                {{ t('admin.locations.viewOnMap') }}
              </a>
              <button
                v-if="location.status === 'rejected'"
                @click="openDeleteModal(location)"
                class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 cursor-pointer"
              >
                {{ t('admin.locations.delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">{{ t('admin.locations.noResults') }}</h3>
    </div>

    <!-- Delete confirmation modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal && locationToDelete"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        @click.self="closeDeleteModal"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">
              {{ t('admin.locations.deleteConfirm.title') }}
            </h3>
          </div>
          <div class="px-6 py-4 space-y-4">
            <!-- Location summary -->
            <div class="flex gap-5">
              <!-- Map preview using Leaflet -->
              <div class="flex-shrink-0 w-[160px] h-[160px] rounded-lg border border-gray-200 overflow-hidden bg-gray-100">
                <div ref="previewMapContainer" class="w-full h-full"></div>
              </div>
              <!-- Location details -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span
                    :class="[
                      'px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0',
                      locationToDelete.status === 'approved' ? 'bg-green-100 text-green-800' :
                      locationToDelete.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    ]"
                  >
                    {{ getStatusLabel(locationToDelete.status) }}
                  </span>
                  <h4 class="text-lg font-semibold text-gray-900 truncate">
                    {{ locationToDelete.name }}
                  </h4>
                </div>
                <p class="text-sm text-gray-600 mt-1">
                  {{ locationToDelete.address }}, {{ locationToDelete.postal_code }} {{ locationToDelete.city }}
                </p>
                <p class="text-xs text-gray-400 mt-0.5 font-mono">
                  {{ locationToDelete.latitude }}, {{ locationToDelete.longitude }}
                </p>

                <!-- Meta info grid -->
                <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div class="flex items-center gap-2 text-gray-500">
                    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{{ formatDate(locationToDelete.created_at) }}</span>
                  </div>
                  <div v-if="locationToDelete.submitted_by_email" class="flex items-center gap-2 text-gray-500">
                    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span class="truncate">{{ locationToDelete.submitted_by_email }}</span>
                  </div>
                  <div v-if="locationToDelete.phone" class="flex items-center gap-2 text-gray-500">
                    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span class="truncate">{{ locationToDelete.phone }}</span>
                  </div>
                  <div v-if="locationToDelete.email" class="flex items-center gap-2 text-gray-500">
                    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span class="truncate">{{ locationToDelete.email }}</span>
                  </div>
                  <div v-if="locationToDelete.website" class="flex items-center gap-2 text-gray-500 col-span-2">
                    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span class="truncate">{{ locationToDelete.website }}</span>
                  </div>
                  <div v-if="locationToDelete.instagram" class="flex items-center gap-2 text-gray-500">
                    <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span class="truncate">{{ locationToDelete.instagram }}</span>
                  </div>
                </div>

                <!-- Rejection reason if available -->
                <div v-if="locationToDelete.rejection_reason" class="mt-3 text-sm">
                  <p class="text-gray-500 font-medium">{{ t('admin.locations.deleteConfirm.rejectionReason') }}:</p>
                  <p class="text-gray-700 mt-1">{{ locationToDelete.rejection_reason }}</p>
                </div>
              </div>
            </div>
            <!-- Warning message -->
            <p class="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {{ t('admin.locations.deleteConfirm.warning') }}
            </p>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              @click="closeDeleteModal"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              :disabled="deleting"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              @click="handleDelete"
              class="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 cursor-pointer disabled:bg-gray-400"
              :disabled="deleting"
            >
              {{ deleting ? t('common.loading') : t('admin.locations.deleteConfirm.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { useCategoriesStore } from '@/stores/categories'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import L from 'leaflet'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const categoriesStore = useCategoriesStore()

type TabValue = 'all' | 'pending' | 'approved' | 'rejected'

type LocationWithCategories = typeof adminStore.locations.value[number]

const activeTab = ref<TabValue>('all')
const searchQuery = ref('')
const categoryFilter = ref<string | null>(null)
const showDeleteModal = ref(false)
const locationToDelete = ref<LocationWithCategories | null>(null)
const deleting = ref(false)
const previewMapContainer = ref<HTMLElement | null>(null)
let previewMap: L.Map | null = null

const loading = computed(() => adminStore.loading)
const error = computed(() => adminStore.error)

// Get the selected category name for display
const selectedCategory = computed(() => {
  if (!categoryFilter.value) return null
  return categoriesStore.categories.find(c => c.id === categoryFilter.value)
})

const tabs = computed<{ value: TabValue; label: string; count: number }[]>(() => [
  { value: 'all', label: t('admin.locations.tabs.all'), count: adminStore.stats.total },
  { value: 'pending', label: t('admin.locations.tabs.pending'), count: adminStore.stats.pending },
  { value: 'approved', label: t('admin.locations.tabs.approved'), count: adminStore.stats.approved },
  { value: 'rejected', label: t('admin.locations.tabs.rejected'), count: adminStore.stats.rejected }
])

const filteredLocations = computed(() => {
  let locations = adminStore.locations

  // Filter by tab
  if (activeTab.value !== 'all') {
    locations = locations.filter(l => l.status === activeTab.value)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    locations = locations.filter(l =>
      l.name.toLowerCase().includes(query) ||
      l.city.toLowerCase().includes(query) ||
      l.address.toLowerCase().includes(query)
    )
  }

  return locations
})

function getStatusLabel(status: string | null): string {
  switch (status) {
    case 'approved': return t('admin.form.statusApproved')
    case 'rejected': return t('admin.form.statusRejected')
    case 'pending': return t('admin.form.statusPending')
    default: return status || ''
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

async function handleApprove(locationId: string) {
  try {
    await adminStore.approveLocation(locationId)
  } catch (e) {
    console.error('Failed to approve location:', e)
  }
}

async function openDeleteModal(location: LocationWithCategories) {
  locationToDelete.value = location
  showDeleteModal.value = true

  // Initialize map after DOM updates
  await nextTick()

  if (previewMapContainer.value && locationToDelete.value) {
    // Geocode from address for accuracy
    const address = `${locationToDelete.value.address}, ${locationToDelete.value.postal_code} ${locationToDelete.value.city}`
    let lat = Number(locationToDelete.value.latitude)
    let lng = Number(locationToDelete.value.longitude)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        { headers: { 'User-Agent': 'ZeroWasteFrankfurt/1.0' } }
      )
      const data = await response.json()
      if (data && data.length > 0) {
        lat = parseFloat(data[0].lat)
        lng = parseFloat(data[0].lon)
      }
    } catch (e) {
      // Fall back to stored coordinates if geocoding fails
      console.warn('Geocoding failed, using stored coordinates:', e)
    }

    previewMap = L.map(previewMapContainer.value, {
      zoomControl: true,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true
    }).setView([lat, lng], 17)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(previewMap)

    // Add marker
    L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: '#ef4444',
      color: '#ffffff',
      weight: 2,
      fillOpacity: 1
    }).addTo(previewMap)
  }
}

function closeDeleteModal() {
  // Destroy map
  if (previewMap) {
    previewMap.remove()
    previewMap = null
  }
  showDeleteModal.value = false
  locationToDelete.value = null
}

async function handleDelete() {
  if (!locationToDelete.value) return

  deleting.value = true
  try {
    await adminStore.deleteLocation(locationToDelete.value.id)
    closeDeleteModal()
  } catch (e) {
    console.error('Failed to delete location:', e)
  } finally {
    deleting.value = false
  }
}

function clearCategoryFilter() {
  categoryFilter.value = null
  router.replace({ query: {} })
}

// Watch for route query changes
watch(() => route.query.category, async (newCategory) => {
  categoryFilter.value = newCategory as string | null
  await adminStore.fetchLocations(undefined, true, categoryFilter.value || undefined)
}, { immediate: false })

onMounted(async () => {
  // Load categories for filter display
  await categoriesStore.fetchCategories()

  // Check for category filter in query params
  if (route.query.category) {
    categoryFilter.value = route.query.category as string
  }

  await adminStore.fetchLocations(undefined, true, categoryFilter.value || undefined)
})
</script>
