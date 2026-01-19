<template>
  <div class="relative">
    <button
      :class="[
        'flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
        compact
          ? 'w-12 h-12 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 hover:shadow-xl'
          : 'px-4 py-3 rounded-lg bg-green-500 text-white shadow-md hover:bg-green-600 hover:shadow-lg'
      ]"
      :disabled="loading"
      @click="handleNearMe"
      :title="t('map.nearMe')"
    >
      <svg
        v-if="!loading"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        :class="compact ? 'w-6 h-6' : 'w-5 h-5'"
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
      <div
        v-else
        :class="[
          'border-2 rounded-full animate-spin',
          compact
            ? 'w-6 h-6 border-white/30 border-t-white'
            : 'w-5 h-5 border-white/30 border-t-white'
        ]"
      />
      <span v-if="!compact">{{ t('map.nearMe') }}</span>
    </button>

    <div
      v-if="error"
      :class="[
        'px-3 py-2 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm shadow-lg',
        compact ? 'absolute right-0 bottom-full mb-2 w-56' : 'mt-2'
      ]"
    >
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useNearby } from '@/composables/useNearby'

defineProps<{
  compact?: boolean
}>()

const emit = defineEmits<{
  'locations-found': [locations: any[], userLat: number, userLng: number, accuracy: number]
}>()

const { t } = useI18n()
const { results, loading, error, getUserLocation, findNearby } = useNearby()

async function handleNearMe() {
  const location = await getUserLocation()

  if (location) {
    await findNearby(location.lat, location.lng, 5000)
    emit('locations-found', results.value, location.lat, location.lng, location.accuracy)
  }
}
</script>
