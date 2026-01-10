<template>
  <AdminLayout>
    <div class="mb-6">
      <router-link
        to="/bulk-station/locations"
        class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <svg class="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {{ t('common.back') }}
      </router-link>
      <h1 class="mt-2 text-2xl font-bold text-gray-900">{{ t('admin.edit.title') }}</h1>
    </div>

    <div v-if="loading && !location" class="text-center py-12">
      <p>{{ t('common.loading') }}...</p>
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md" role="alert">
      <p>{{ error }}</p>
    </div>

    <div v-else-if="location" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Edit Form -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t('admin.edit.form') }}</h2>
        <LocationEditForm
          :location="location"
          :categories="categories"
          :loading="saving"
          @save="handleSave"
          @cancel="handleCancel"
          @update:preview="handlePreviewUpdate"
        />
      </div>

      <!-- Preview -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t('admin.edit.preview') }}</h2>
        <LocationPreview :location="previewData" :categories="selectedCategoriesForPreview" />
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/lib/supabase'
import { useAdminStore } from '@/stores/admin'
import { useCategoriesStore } from '@/stores/categories'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import LocationEditForm from '@/components/admin/LocationEditForm.vue'
import LocationPreview from '@/components/admin/LocationPreview.vue'
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row']

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const categoriesStore = useCategoriesStore()

const location = ref<any>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const previewData = ref<Partial<Location>>({})

const locationId = route.params.id as string

const categories = computed(() => categoriesStore.categories)

const selectedCategoriesForPreview = computed(() => {
  // This would be passed from the form component when categories are selected
  return []
})

onMounted(async () => {
  await categoriesStore.fetchCategories()
  await fetchLocation()
})

async function fetchLocation() {
  loading.value = true
  error.value = null

  try {
    const { data, error: fetchError } = await supabase
      .from('locations')
      .select(`
        *,
        location_categories(category_id)
      `)
      .eq('id', locationId)
      .single()

    if (fetchError) {
      error.value = fetchError.message
      return
    }

    location.value = data
    previewData.value = data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to fetch location'
  } finally {
    loading.value = false
  }
}

async function handleSave(payload: { location: Partial<Location>; categoryIds: string[] }) {
  saving.value = true
  error.value = null

  try {
    await adminStore.updateLocation(locationId, payload.location, payload.categoryIds)
    await router.push('/bulk-station/locations')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to save location'
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  router.push('/bulk-station/locations')
}

function handlePreviewUpdate(data: Partial<Location>) {
  previewData.value = data
}
</script>
