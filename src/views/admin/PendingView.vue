<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/bulk-station" class="text-gray-600 hover:text-gray-900 cursor-pointer">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </router-link>
            <h1 class="ml-4 text-xl font-bold">{{ t('admin.pending.title') }}</h1>
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div v-if="loading && pendingLocations.length === 0" class="text-center py-12">
        <p>{{ t('common.loading') }}...</p>
      </div>

      <div v-else-if="error" class="bg-red-50 p-4 rounded-md" role="alert">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <div v-else-if="pendingLocations.length === 0" class="text-center py-12">
        <p class="text-gray-500">{{ t('admin.pending.noLocations') }}</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="location in pendingLocations"
          :key="location.id"
          class="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          :class="{ 'ring-2 ring-green-500': selectedLocation?.id === location.id }"
          @click="selectLocation(location)"
        >
          <div class="flex justify-between items-center">
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-gray-900 truncate">{{ location.name }}</h3>
              <p class="text-sm text-gray-600 truncate">{{ location.address }}, {{ location.city }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ formatDate(location.created_at) }}</p>
            </div>
            <div class="ml-4 flex items-center gap-2">
              <span class="text-sm text-gray-400">{{ t('admin.preview.pendingReview') }}</span>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Panel -->
      <PendingLocationPreviewPanel
        :location="selectedLocation"
        :loading="loading"
        @close="selectedLocation = null"
        @approve="handleApproveFromPanel"
        @reject="handleRejectFromPanel"
      />

      <!-- Reject Modal -->
      <teleport to="body">
        <div
          v-if="showRejectModal"
          class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-[1010]"
          @click.self="showRejectModal = false"
        >
          <div class="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 class="text-lg font-semibold mb-4">{{ t('admin.rejectModal.title') }}</h3>
            <textarea
              v-model="rejectReason"
              class="w-full border rounded-md p-2 mb-4"
              rows="4"
              :placeholder="t('admin.rejectModal.placeholder')"
            />
            <div class="flex justify-end space-x-2">
              <button
                type="button"
                class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                @click="showRejectModal = false"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="button"
                class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
                @click="confirmReject"
              >
                {{ t('admin.reject') }}
              </button>
            </div>
          </div>
        </div>
      </teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdmin } from '@/composables/useAdmin'
import PendingLocationPreviewPanel from '@/components/admin/PendingLocationPreviewPanel.vue'
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row'] & {
  location_categories?: {
    categories: Database['public']['Tables']['categories']['Row']
  }[]
}

const { t } = useI18n()
const { pendingLocations, loading, error, fetchPendingLocations, approveLocation, rejectLocation } = useAdmin()

const showRejectModal = ref(false)
const rejectReason = ref('')
const locationToReject = ref<string | null>(null)
const selectedLocation = ref<Location | null>(null)

onMounted(async () => {
  await fetchPendingLocations()
})

function selectLocation(location: Location) {
  selectedLocation.value = location
}

async function handleApproveFromPanel(locationId: string) {
  await approveLocation(locationId)
  selectedLocation.value = null
}

function handleRejectFromPanel(locationId: string) {
  locationToReject.value = locationId
  showRejectModal.value = true
}

async function confirmReject() {
  if (locationToReject.value) {
    await rejectLocation(locationToReject.value, rejectReason.value)
    showRejectModal.value = false
    rejectReason.value = ''
    locationToReject.value = null
    selectedLocation.value = null
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}
</script>
