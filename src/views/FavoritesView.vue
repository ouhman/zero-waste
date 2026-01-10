<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <h1 class="text-3xl font-bold text-gray-900 mb-6">
          {{ t('favorites.title') }}
        </h1>

        <div v-if="loading" class="text-center py-12">
          <p>{{ t('common.loading') }}...</p>
        </div>

        <div v-else-if="favorites.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">{{ t('favorites.noFavorites') }}</h3>
          <p class="mt-1 text-sm text-gray-500">{{ t('favorites.noFavoritesDescription') }}</p>
          <div class="mt-6">
            <router-link
              to="/"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {{ t('favorites.browseLocations') }}
            </router-link>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="location in favoriteLocations"
            :key="location.id"
            class="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
          >
            <div class="p-5">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h3 class="text-lg font-medium text-gray-900">
                    {{ location.name }}
                  </h3>
                  <p class="mt-1 text-sm text-gray-500">
                    {{ location.address }}
                  </p>
                </div>
                <FavoriteButton :location-id="location.id" />
              </div>
              <div class="mt-4">
                <router-link
                  :to="`/location/${location.slug}`"
                  class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {{ t('map.viewDetails') }}
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFavorites } from '@/composables/useFavorites'
import { supabase } from '@/lib/supabase'
import FavoriteButton from '@/components/FavoriteButton.vue'
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row']

const { t } = useI18n()
const { favorites } = useFavorites()

const favoriteLocations = ref<Location[]>([])
const loading = ref(false)

onMounted(async () => {
  await fetchFavoriteLocations()
})

// Watch favorites array and update locations when it changes
watch(favorites, async () => {
  await fetchFavoriteLocations()
}, { deep: true })

async function fetchFavoriteLocations() {
  if (favorites.value.length === 0) {
    favoriteLocations.value = []
    return
  }

  loading.value = true

  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .in('id', favorites.value)
      .eq('status', 'approved')

    if (error) {
      console.error('Failed to fetch favorite locations:', error)
      return
    }

    favoriteLocations.value = data || []
  } catch (error) {
    console.error('Failed to fetch favorite locations:', error)
  } finally {
    loading.value = false
  }
}
</script>
