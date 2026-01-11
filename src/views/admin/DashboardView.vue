<template>
  <AdminLayout>
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ t('admin.dashboard.title') }}</h1>
        <p class="mt-1 text-sm text-gray-600">{{ t('admin.dashboard.subtitle') }}</p>
      </div>

      <!-- Loading State -->
      <LoadingSpinner v-if="loading" :centered="true" text="Loading dashboard..." />

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">{{ error }}</p>
        <button
          type="button"
          class="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          @click="fetchData"
        >
          Try again
        </button>
      </div>

      <!-- Dashboard Content -->
      <div v-else>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <!-- Pending Locations Card -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      {{ t('admin.dashboard.pendingLocations') }}
                    </dt>
                    <dd class="text-3xl font-semibold text-gray-900">
                      {{ stats.pending }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-5 py-3">
              <router-link
                to="/bulk-station/pending"
                class="text-sm font-medium text-blue-700 hover:text-blue-900"
              >
                {{ t('admin.dashboard.viewAll') }}
              </router-link>
            </div>
          </div>

          <!-- Approved Locations Card -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      {{ t('admin.dashboard.approvedLocations') }}
                    </dt>
                    <dd class="text-3xl font-semibold text-gray-900">
                      {{ stats.approved }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- Rejected Locations Card -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      {{ t('admin.dashboard.rejectedLocations') }}
                    </dt>
                    <dd class="text-3xl font-semibold text-gray-900">
                      {{ stats.rejected }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Submissions -->
        <div v-if="recentSubmissions.length > 0" class="mt-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t('admin.dashboard.recentSubmissions') }}</h2>
          <div class="bg-white shadow rounded-lg overflow-hidden">
            <ul class="divide-y divide-gray-200">
              <li
                v-for="location in recentSubmissions"
                :key="location.id"
                class="p-4 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">
                      {{ location.name }}
                    </p>
                    <p class="text-sm text-gray-500">
                      {{ location.address }}, {{ location.city }}
                    </p>
                    <p class="text-xs text-gray-400 mt-1">
                      {{ formatDate(location.created_at) }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2 ml-4">
                    <button
                      type="button"
                      class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      :disabled="approving === location.id"
                      @click="handleQuickApprove(location.id)"
                    >
                      <svg v-if="approving === location.id" class="animate-spin -ml-0.5 mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {{ t('admin.approve') }}
                    </button>
                    <router-link
                      :to="`/bulk-station/edit/${location.id}`"
                      class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {{ t('admin.editButton') }}
                    </router-link>
                  </div>
                </div>
              </li>
            </ul>
            <div class="bg-gray-50 px-4 py-3">
              <router-link
                to="/bulk-station/locations?status=pending"
                class="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {{ t('admin.dashboard.viewAllPending') }} →
              </router-link>
            </div>
          </div>
        </div>

        <!-- Empty State for No Pending -->
        <EmptyState
          v-else
          :title="t('admin.dashboard.noPending')"
          :description="t('admin.dashboard.noPendingDescription')"
          class="mt-8"
        />

        <!-- Quick Links -->
        <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <router-link
            to="/bulk-station/locations"
            class="block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-sm font-medium text-gray-900">{{ t('admin.nav.locations') }}</h3>
                <p class="text-xs text-gray-500">{{ t('admin.dashboard.manageLocations') }}</p>
              </div>
            </div>
          </router-link>

          <router-link
            to="/bulk-station/categories"
            class="block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-sm font-medium text-gray-900">{{ t('admin.nav.categories') }}</h3>
                <p class="text-xs text-gray-500">{{ t('admin.dashboard.manageCategories') }}</p>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/stores/admin'
import { useToast } from '@/composables/useToast'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const { t } = useI18n()
const adminStore = useAdminStore()
const toast = useToast()

const loading = ref(false)
const error = ref<string | null>(null)
const approving = ref<string | null>(null)

const stats = computed(() => adminStore.stats)
const recentSubmissions = computed(() => adminStore.pendingLocations.slice(0, 5))

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  loading.value = true
  error.value = null

  try {
    await adminStore.fetchLocations()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load dashboard data'
  } finally {
    loading.value = false
  }
}

async function handleQuickApprove(id: string) {
  approving.value = id

  try {
    await adminStore.approveLocation(id)
    toast.success(t('admin.dashboard.approveSuccess'))
  } catch (e) {
    toast.error(e instanceof Error ? e.message : t('admin.dashboard.approveFailed'))
  } finally {
    approving.value = null
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

  return date.toLocaleDateString()
}
</script>
