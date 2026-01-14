<template>
  <div>
    <!-- Filter Tabs -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          :class="[
            activeTab === tab.value
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm cursor-pointer'
          ]"
        >
          {{ tab.label }}
          <span
            v-if="tab.value === 'pending' && pendingSuggestionsCount > 0"
            :class="[
              activeTab === tab.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900',
              'ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium'
            ]"
          >
            {{ pendingSuggestionsCount }}
          </span>
        </button>
      </nav>
    </div>

    <!-- Loading State -->
    <LoadingSpinner v-if="loading" :centered="true" text="Loading suggestions..." />

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-800">{{ error }}</p>
      <button
        type="button"
        class="mt-2 text-sm text-red-600 hover:text-red-800 underline cursor-pointer"
        @click="loadSuggestions"
      >
        Try again
      </button>
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="!filteredSuggestions.length"
      :title="t('admin.hoursSuggestions.noSuggestions')"
      :description="getEmptyStateDescription()"
    />

    <!-- Suggestions List -->
    <div v-else class="space-y-4">
      <div
        v-for="suggestion in filteredSuggestions"
        :key="suggestion.id"
        class="bg-white border border-gray-200 rounded-lg p-6"
      >
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <div>
            <router-link
              :to="`/bulk-station/edit/${suggestion.location_id}`"
              class="text-lg font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              {{ suggestion.location.name }}
            </router-link>
            <p class="text-sm text-gray-500 mt-1">
              {{ t('admin.hoursSuggestions.submittedAt') }}: {{ formatDate(suggestion.created_at) }}
            </p>
          </div>
          <span
            :class="[
              'px-2.5 py-0.5 rounded-full text-xs font-medium',
              getStatusClass(suggestion.status)
            ]"
          >
            {{ t(`admin.hoursSuggestions.status.${suggestion.status}`) }}
          </span>
        </div>

        <!-- Hours Comparison -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">
              {{ t('admin.hoursSuggestions.currentHours') }}
            </h4>
            <div class="bg-gray-50 p-3 rounded-md">
              <HoursTable :hours="suggestion.location.opening_hours_structured" />
            </div>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">
              {{ t('admin.hoursSuggestions.suggestedHours') }}
            </h4>
            <div class="bg-yellow-50 p-3 rounded-md">
              <HoursTable
                :hours="suggestion.suggested_hours"
                :highlight="true"
                :compare-with="suggestion.location.opening_hours_structured"
              />
            </div>
          </div>
        </div>

        <!-- User Note -->
        <div v-if="suggestion.note" class="bg-blue-50 p-3 rounded-md mb-4">
          <p class="text-sm text-gray-700">
            <span class="font-medium">{{ t('admin.hoursSuggestions.userNote') }}:</span>
            {{ suggestion.note }}
          </p>
        </div>

        <!-- Admin Note (if reviewed) -->
        <div v-if="suggestion.admin_note" class="bg-purple-50 p-3 rounded-md mb-4">
          <p class="text-sm text-gray-700">
            <span class="font-medium">{{ t('admin.hoursSuggestions.adminNote') }}:</span>
            {{ suggestion.admin_note }}
          </p>
        </div>

        <!-- Action Buttons (only for pending) -->
        <div v-if="suggestion.status === 'pending'" class="flex items-center gap-2 pt-4 border-t border-gray-200">
          <button
            type="button"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer"
            :disabled="reviewingId === suggestion.id"
            @click="handleApprove(suggestion.id)"
          >
            <svg v-if="reviewingId === suggestion.id" class="animate-spin -ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ t('admin.hoursSuggestions.approve') }}
          </button>
          <button
            type="button"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
            :disabled="reviewingId === suggestion.id"
            @click="handleReject(suggestion.id)"
          >
            {{ t('admin.hoursSuggestions.reject') }}
          </button>
        </div>

        <!-- Review Info (if reviewed) -->
        <div v-else-if="suggestion.reviewed_at" class="pt-4 border-t border-gray-200">
          <p class="text-sm text-gray-500">
            {{ t('admin.hoursSuggestions.reviewedAt') }}: {{ formatDate(suggestion.reviewed_at) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/stores/admin'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import HoursTable from './HoursTable.vue'

const { t } = useI18n()
const adminStore = useAdminStore()
const toast = useToast()

const activeTab = ref<'pending' | 'approved' | 'rejected'>('pending')
const reviewingId = ref<string | null>(null)

const tabs = computed(() => [
  { label: t('admin.hoursSuggestions.tabs.pending'), value: 'pending' as const },
  { label: t('admin.hoursSuggestions.tabs.approved'), value: 'approved' as const },
  { label: t('admin.hoursSuggestions.tabs.rejected'), value: 'rejected' as const }
])

const loading = computed(() => adminStore.loading)
const error = computed(() => adminStore.error)
const pendingSuggestionsCount = computed(() => adminStore.pendingSuggestionsCount)

const filteredSuggestions = computed(() => {
  return adminStore.hoursSuggestions.filter(s => s.status === activeTab.value)
})

onMounted(async () => {
  await loadSuggestions()
  await adminStore.fetchPendingSuggestionsCount()
})

async function loadSuggestions() {
  await adminStore.fetchHoursSuggestions()
}

async function handleApprove(id: string) {
  reviewingId.value = id

  try {
    const { error } = await adminStore.reviewSuggestion(id, 'approved')
    if (error) {
      toast.error(error.message || t('admin.hoursSuggestions.approveFailed'))
    } else {
      toast.success(t('admin.hoursSuggestions.approveSuccess'))
    }
  } catch (e) {
    toast.error(e instanceof Error ? e.message : t('admin.hoursSuggestions.approveFailed'))
  } finally {
    reviewingId.value = null
  }
}

async function handleReject(id: string) {
  reviewingId.value = id

  try {
    const { error } = await adminStore.reviewSuggestion(id, 'rejected')
    if (error) {
      toast.error(error.message || t('admin.hoursSuggestions.rejectFailed'))
    } else {
      toast.success(t('admin.hoursSuggestions.rejectSuccess'))
    }
  } catch (e) {
    toast.error(e instanceof Error ? e.message : t('admin.hoursSuggestions.rejectFailed'))
  } finally {
    reviewingId.value = null
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getEmptyStateDescription() {
  switch (activeTab.value) {
    case 'pending':
      return t('admin.hoursSuggestions.noPendingDescription')
    case 'approved':
      return t('admin.hoursSuggestions.noApprovedDescription')
    case 'rejected':
      return t('admin.hoursSuggestions.noRejectedDescription')
    default:
      return ''
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
