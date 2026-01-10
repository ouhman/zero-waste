<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">{{ t('admin.categories.title') }}</h1>
        <button
          @click="openCreateModal"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {{ t('admin.categories.addCategory') }}
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="categoriesStore.loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error state -->
      <div v-else-if="categoriesStore.error" class="bg-red-50 border border-red-200 rounded-md p-4">
        <p class="text-sm text-red-800">{{ categoriesStore.error }}</p>
      </div>

      <!-- Categories table -->
      <div v-else class="bg-white shadow-sm rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ t('admin.categories.table.icon') }}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ t('admin.categories.table.name') }}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ t('admin.categories.table.slug') }}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ t('admin.categories.table.locations') }}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ t('admin.categories.table.sortOrder') }}
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ t('admin.locations.table.actions') }}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="category in categoriesWithCounts" :key="category.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <img
                  :src="category.icon_url || `/icons/categories/${category.slug}.png`"
                  :alt="category.name_en"
                  class="h-8 w-8"
                  @error="handleImageError"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ category.name_de }}</div>
                <div class="text-sm text-gray-500">{{ category.name_en }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <code class="text-sm text-gray-600">{{ category.slug }}</code>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900">{{ category.locationCount }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900">{{ category.sort_order ?? '-' }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button
                  @click="openEditModal(category)"
                  class="text-blue-600 hover:text-blue-900"
                >
                  {{ t('admin.editButton') }}
                </button>
                <button
                  @click="openDeleteModal(category)"
                  class="text-red-600 hover:text-red-900"
                  :disabled="category.slug === 'andere'"
                  :class="{ 'opacity-50 cursor-not-allowed': category.slug === 'andere' }"
                >
                  {{ t('admin.categories.delete') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <CategoryEditModal
      v-if="showEditModal"
      :category="selectedCategory"
      @close="closeEditModal"
      @save="handleSaveCategory"
    />

    <CategoryDeleteModal
      v-if="showDeleteModal"
      :category="selectedCategory!"
      :all-categories="categoriesStore.categories"
      @close="closeDeleteModal"
      @delete="handleDeleteCategory"
    />
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategoriesStore } from '@/stores/categories'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import CategoryEditModal from '@/components/admin/CategoryEditModal.vue'
import CategoryDeleteModal from '@/components/admin/CategoryDeleteModal.vue'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

const { t } = useI18n()
const categoriesStore = useCategoriesStore()

const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedCategory = ref<Category | null>(null)
const locationCounts = ref<Map<string, number>>(new Map())

const categoriesWithCounts = computed(() => {
  return categoriesStore.categories.map(category => ({
    ...category,
    locationCount: locationCounts.value.get(category.id) ?? 0
  }))
})

async function loadLocationCounts() {
  for (const category of categoriesStore.categories) {
    const count = await categoriesStore.getLocationCountForCategory(category.id)
    locationCounts.value.set(category.id, count)
  }
}

function openCreateModal() {
  selectedCategory.value = null
  showEditModal.value = true
}

function openEditModal(category: Category) {
  selectedCategory.value = category
  showEditModal.value = true
}

function openDeleteModal(category: Category) {
  selectedCategory.value = category
  showDeleteModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  selectedCategory.value = null
}

function closeDeleteModal() {
  showDeleteModal.value = false
  selectedCategory.value = null
}

async function handleSaveCategory() {
  closeEditModal()
  await categoriesStore.fetchCategories(true)
  await loadLocationCounts()
}

async function handleDeleteCategory() {
  closeDeleteModal()
  await categoriesStore.fetchCategories(true)
  await loadLocationCounts()
}

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement
  img.src = '/icons/categories/andere.png' // Fallback icon
}

onMounted(async () => {
  await categoriesStore.fetchCategories()
  await loadLocationCounts()
})
</script>
