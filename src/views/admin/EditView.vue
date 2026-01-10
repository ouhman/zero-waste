<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/admin/pending" class="text-gray-600 hover:text-gray-900">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </router-link>
            <h1 class="ml-4 text-xl font-bold">{{ t('admin.edit.title') }}</h1>
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="bg-white shadow rounded-lg p-6">
        <div v-if="loading && !location" class="text-center py-12">
          <p>{{ t('common.loading') }}...</p>
        </div>

        <div v-else-if="error" class="bg-red-50 p-4 rounded-md" role="alert">
          <p class="text-red-800">{{ error }}</p>
        </div>

        <div v-else-if="location">
          <LocationForm
            mode="edit"
            :existing-location="location"
            :loading="saving"
            @submit="handleSave"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/lib/supabase'
import { useAdmin } from '@/composables/useAdmin'
import LocationForm from '@/components/LocationForm.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { updateLocation } = useAdmin()

const location = ref<any>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const locationId = route.params.id as string

onMounted(async () => {
  await fetchLocation()
})

async function fetchLocation() {
  loading.value = true
  error.value = null

  try {
    const { data, error: fetchError } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single()

    if (fetchError) {
      error.value = fetchError.message
      return
    }

    location.value = data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to fetch location'
  } finally {
    loading.value = false
  }
}

async function handleSave(formData: any) {
  saving.value = true

  try {
    await updateLocation(locationId, formData)
    // Navigate back to pending list
    await router.push('/admin/pending')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to save location'
  } finally {
    saving.value = false
  }
}
</script>
