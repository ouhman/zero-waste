<template>
  <Teleport to="body">
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm" @click.self="$emit('close')">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">
            {{ isEdit ? t('admin.categories.editCategory') : t('admin.categories.addCategory') }}
          </h3>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="px-6 py-4 space-y-6">
          <!-- Name (German) -->
          <div>
            <label for="name_de" class="block text-sm font-medium text-gray-700">
              {{ t('admin.categories.form.nameDe') }} *
            </label>
            <input
              id="name_de"
              v-model="formData.name_de"
              type="text"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              :class="{ 'border-red-300': errors.name_de }"
              @input="generateSlug"
            />
            <p v-if="errors.name_de" class="mt-1 text-sm text-red-600">{{ errors.name_de }}</p>
          </div>

          <!-- Name (English) -->
          <div>
            <label for="name_en" class="block text-sm font-medium text-gray-700">
              {{ t('admin.categories.form.nameEn') }} *
            </label>
            <input
              id="name_en"
              v-model="formData.name_en"
              type="text"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              :class="{ 'border-red-300': errors.name_en }"
            />
            <p v-if="errors.name_en" class="mt-1 text-sm text-red-600">{{ errors.name_en }}</p>
          </div>

          <!-- Slug -->
          <div>
            <label for="slug" class="block text-sm font-medium text-gray-700">
              {{ t('admin.form.slug') }} *
            </label>
            <input
              id="slug"
              v-model="formData.slug"
              type="text"
              required
              pattern="[a-z0-9-]+"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
              :class="{ 'border-red-300': errors.slug }"
            />
            <p class="mt-1 text-sm text-gray-500">{{ t('admin.form.slugHelp') }}</p>
            <p v-if="errors.slug" class="mt-1 text-sm text-red-600">{{ errors.slug }}</p>
          </div>

          <!-- Description (German) -->
          <div>
            <label for="description_de" class="block text-sm font-medium text-gray-700">
              {{ t('admin.categories.form.descriptionDe') }}
            </label>
            <textarea
              id="description_de"
              v-model="formData.description_de"
              rows="3"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            ></textarea>
          </div>

          <!-- Description (English) -->
          <div>
            <label for="description_en" class="block text-sm font-medium text-gray-700">
              {{ t('admin.categories.form.descriptionEn') }}
            </label>
            <textarea
              id="description_en"
              v-model="formData.description_en"
              rows="3"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            ></textarea>
          </div>

          <!-- Color -->
          <div>
            <label for="color" class="block text-sm font-medium text-gray-700">
              {{ t('admin.categories.form.color') }}
            </label>
            <div class="mt-1 flex items-center gap-2">
              <input
                id="color"
                v-model="formData.color"
                type="color"
                class="h-10 w-20 rounded border border-gray-300"
              />
              <input
                v-model="formData.color"
                type="text"
                pattern="#[0-9a-fA-F]{6}"
                placeholder="#3B82F6"
                class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
              />
            </div>
          </div>

          <!-- Sort Order -->
          <div>
            <label for="sort_order" class="block text-sm font-medium text-gray-700">
              {{ t('admin.categories.form.sortOrder') }}
            </label>
            <input
              id="sort_order"
              v-model.number="formData.sort_order"
              type="number"
              min="0"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p class="mt-1 text-sm text-gray-500">{{ t('admin.categories.form.sortOrderHelp') }}</p>
          </div>

          <!-- Icon Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700">
              {{ t('admin.categories.form.icon') }}
            </label>

            <!-- Current icon preview -->
            <div v-if="iconPreview || (isEdit && category?.icon_url)" class="mt-2 mb-4">
              <p class="text-sm text-gray-500 mb-2">{{ t('admin.categories.form.currentIcon') }}</p>
              <img
                :src="iconPreview || category?.icon_url || `/icons/categories/${formData.slug}.png`"
                alt="Icon preview"
                class="h-16 w-16 border border-gray-300 rounded"
                @error="handleImageError"
              />
            </div>

            <!-- File input -->
            <input
              type="file"
              accept="image/png"
              class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              @change="handleFileChange"
            />
            <p class="mt-1 text-sm text-gray-500">{{ t('admin.categories.form.iconHelp') }}</p>
            <p v-if="errors.icon" class="mt-1 text-sm text-red-600">{{ errors.icon }}</p>
          </div>

          <!-- Error message -->
          <div v-if="errorMessage" class="rounded-md bg-red-50 p-4">
            <p class="text-sm text-red-800">{{ errorMessage }}</p>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed"
              :disabled="loading"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
              :disabled="loading"
            >
              {{ loading ? t('common.loading') : t('common.save') }}
            </button>
          </div>
        </form>
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
  category?: Category | null
}>()

const emit = defineEmits<{
  close: []
  save: []
}>()

const { t } = useI18n()
const categoriesStore = useCategoriesStore()

const isEdit = computed(() => !!props.category)

const formData = ref({
  name_de: '',
  name_en: '',
  slug: '',
  description_de: '',
  description_en: '',
  color: '#3B82F6',
  sort_order: 0
})

const errors = ref<Record<string, string>>({})
const errorMessage = ref('')
const loading = ref(false)
const iconFile = ref<File | null>(null)
const iconPreview = ref<string | null>(null)

function generateSlug() {
  if (!isEdit.value && formData.value.name_de) {
    formData.value.slug = formData.value.name_de
      .toLowerCase()
      .replace(/[äöüß]/g, (match) => {
        const umlautMap: Record<string, string> = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }
        return umlautMap[match] || match
      })
      .normalize('NFD')                    // Decompose other accented chars (é → e + ́)
      .replace(/[\u0300-\u036f]/g, '')     // Remove diacritical marks
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-')                 // Collapse multiple hyphens
  }
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    iconFile.value = null
    iconPreview.value = null
    errors.value.icon = ''
    return
  }

  // Validate file type
  if (!file.type.startsWith('image/png')) {
    errors.value.icon = t('admin.categories.errors.invalidFileType')
    iconFile.value = null
    iconPreview.value = null
    return
  }

  // Validate file size (max 1MB)
  if (file.size > 1024 * 1024) {
    errors.value.icon = t('admin.categories.errors.fileTooLarge')
    iconFile.value = null
    iconPreview.value = null
    return
  }

  iconFile.value = file
  errors.value.icon = ''

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    iconPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement
  img.src = '/icons/categories/andere.png'
}

function validateForm(): boolean {
  errors.value = {}

  if (!formData.value.name_de.trim()) {
    errors.value.name_de = t('admin.categories.errors.nameDeRequired')
  }

  if (!formData.value.name_en.trim()) {
    errors.value.name_en = t('admin.categories.errors.nameEnRequired')
  }

  if (!formData.value.slug.trim()) {
    errors.value.slug = t('admin.categories.errors.slugRequired')
  } else if (!/^[a-z0-9-]+$/.test(formData.value.slug)) {
    errors.value.slug = t('admin.categories.errors.slugInvalid')
  }

  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    if (isEdit.value && props.category) {
      // Update existing category
      await categoriesStore.updateCategory(
        props.category.id,
        {
          name_de: formData.value.name_de,
          name_en: formData.value.name_en,
          slug: formData.value.slug,
          description_de: formData.value.description_de || null,
          description_en: formData.value.description_en || null,
          color: formData.value.color || null,
          sort_order: formData.value.sort_order
        },
        iconFile.value || undefined
      )
    } else {
      // Create new category
      await categoriesStore.createCategory(
        {
          name_de: formData.value.name_de,
          name_en: formData.value.name_en,
          slug: formData.value.slug,
          description_de: formData.value.description_de || null,
          description_en: formData.value.description_en || null,
          color: formData.value.color || null,
          sort_order: formData.value.sort_order
        },
        iconFile.value || undefined
      )
    }

    emit('save')
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('admin.categories.errors.saveFailed')
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
  if (props.category) {
    formData.value = {
      name_de: props.category.name_de,
      name_en: props.category.name_en,
      slug: props.category.slug,
      description_de: props.category.description_de || '',
      description_en: props.category.description_en || '',
      color: props.category.color || '#3B82F6',
      sort_order: props.category.sort_order ?? 0
    }
  }

  // Add keyboard shortcut
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>
