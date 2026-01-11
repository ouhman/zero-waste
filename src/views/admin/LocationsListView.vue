<template>
  <AdminLayout>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('admin.locations.title') }}</h1>
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
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
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
                v-if="location.slug"
                :href="`/location/${location.slug}`"
                target="_blank"
                class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 cursor-pointer inline-block"
              >
                {{ t('admin.locations.viewOnMap') }}
              </a>
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
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/stores/admin'
import AdminLayout from '@/components/admin/AdminLayout.vue'

const { t } = useI18n()
const adminStore = useAdminStore()

type TabValue = 'all' | 'pending' | 'approved' | 'rejected'

const activeTab = ref<TabValue>('all')
const searchQuery = ref('')

const loading = computed(() => adminStore.loading)
const error = computed(() => adminStore.error)

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

onMounted(async () => {
  await adminStore.fetchLocations()
})
</script>
