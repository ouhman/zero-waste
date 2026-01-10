<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-bold">{{ t('admin.dashboard.title') }}</h1>
            </div>
          </div>
          <div class="flex items-center">
            <button
              type="button"
              class="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              @click="handleLogout"
            >
              {{ t('admin.logout') }}
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
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
                to="/admin/pending"
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/lib/supabase'

const { t } = useI18n()
const router = useRouter()

const stats = ref({
  pending: 0,
  approved: 0,
  rejected: 0
})

onMounted(async () => {
  await fetchStats()
})

async function fetchStats() {
  try {
    // Fetch pending count
    const { count: pendingCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Fetch approved count
    const { count: approvedCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')

    // Fetch rejected count
    const { count: rejectedCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected')

    stats.value = {
      pending: pendingCount || 0,
      approved: approvedCount || 0,
      rejected: rejectedCount || 0
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

async function handleLogout() {
  await supabase.auth.signOut()
  await router.push('/admin/login')
}
</script>
