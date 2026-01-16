<template>
  <Teleport to="body">
    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
      <div
        class="bg-white rounded-lg shadow-xl max-w-lg w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 id="delete-modal-title" class="text-lg font-medium text-gray-900">
            {{ t('admin.categories.deleteCategory') }}
          </h3>
        </div>

        <!-- Content -->
        <div class="px-6 py-4 space-y-4">
          <!-- Cannot delete "Other" category -->
          <div v-if="category.slug === 'andere'" class="rounded-md bg-yellow-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">
                  {{ t('admin.categories.errors.cannotDeleteOther') }}
                </h3>
                <p class="mt-2 text-sm text-yellow-700">
                  {{ t('admin.categories.errors.cannotDeleteOtherDescription') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Normal deletion flow -->
          <template v-else>
            <p class="text-sm text-gray-700">
              {{ t('admin.categories.deleteConfirmation', { name: category.name_de }) }}
            </p>

            <!-- Loading location count -->
            <div v-if="loadingCount" class="flex items-center gap-2 text-sm text-gray-600">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              {{ t('common.loading') }}
            </div>

            <!-- Show affected locations count -->
            <div v-else-if="locationCount > 0" class="rounded-md bg-blue-50 p-4">
              <p class="text-sm text-blue-800">
                {{ t('admin.categories.affectedLocations', { count: locationCount }) }}
              </p>
            </div>

            <!-- Reassignment category selector -->
            <div v-if="locationCount > 0">
              <label for="reassign-category" class="block text-sm font-medium text-gray-700">
                {{ t('admin.categories.reassignTo') }} *
              </label>
              <select
                id="reassign-category"
                v-model="selectedReassignCategory"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
                aria-required="true"
              >
                <option value="">{{ t('admin.categories.selectCategory') }}</option>
                <option
                  v-for="cat in availableCategories"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.name_de }} / {{ cat.name_en }}
                </option>
              </select>
              <p class="mt-1 text-sm text-gray-500">
                {{ t('admin.categories.reassignHelp') }}
              </p>
            </div>

            <!-- Confirmation checkbox -->
            <div v-if="locationCount > 0" class="flex items-start">
              <div class="flex items-center h-5">
                <input
                  id="confirm-delete"
                  v-model="confirmDelete"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div class="ml-3">
                <label for="confirm-delete" class="text-sm text-gray-700">
                  {{ t('admin.categories.confirmReassign', { count: locationCount }) }}
                </label>
              </div>
            </div>

            <!-- No locations message -->
            <div v-if="locationCount === 0" class="rounded-md bg-green-50 p-4">
              <p class="text-sm text-green-800">
                {{ t('admin.categories.noLocations') }}
              </p>
            </div>

            <!-- Error message -->
            <div v-if="errorMessage" class="rounded-md bg-red-50 p-4">
              <p class="text-sm text-red-800">{{ errorMessage }}</p>
            </div>
          </template>
        </div>

        <!-- Actions -->
        <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed"
            :disabled="loading"
          >
            {{ category.slug === 'andere' ? t('common.close') : t('common.cancel') }}
          </button>
          <button
            v-if="category.slug !== 'andere'"
            type="button"
            @click="handleDelete"
            class="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
            :disabled="loading || (locationCount > 0 && (!confirmDelete || !selectedReassignCategory))"
          >
            {{ loading ? t('common.loading') : t('admin.categories.delete') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategoriesStore } from '@/stores/categories'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

const props = defineProps<{
  category: Category
  allCategories: Category[]
}>()

const emit = defineEmits<{
  close: []
  delete: []
}>()

const { t } = useI18n()
const categoriesStore = useCategoriesStore()

const loading = ref(false)
const loadingCount = ref(true)
const errorMessage = ref('')
const locationCount = ref(0)
const selectedReassignCategory = ref('')
const confirmDelete = ref(false)

const availableCategories = computed(() => {
  // Exclude the category being deleted
  return props.allCategories.filter(cat => cat.id !== props.category.id)
})

async function loadLocationCount() {
  loadingCount.value = true
  try {
    locationCount.value = await categoriesStore.getLocationCountForCategory(props.category.id)

    // Default to "andere" (Other) category if available
    const andereCategory = availableCategories.value.find(c => c.slug === 'andere')
    if (andereCategory) {
      selectedReassignCategory.value = andereCategory.id
    }
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Failed to load location count'
  } finally {
    loadingCount.value = false
  }
}

async function handleDelete() {
  if (props.category.slug === 'andere') {
    return // Should not happen due to UI restrictions
  }

  if (locationCount.value > 0 && !selectedReassignCategory.value) {
    errorMessage.value = t('admin.categories.errors.selectReassignCategory')
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    // Use the selected category or the category itself (for 0 locations case)
    const reassignTo = selectedReassignCategory.value || props.category.id

    await categoriesStore.deleteCategory(props.category.id, reassignTo)
    emit('delete')
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('admin.categories.errors.deleteFailed')
  } finally {
    loading.value = false
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  loadLocationCount()
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>
