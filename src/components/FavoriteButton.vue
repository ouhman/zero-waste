<template>
  <button
    type="button"
    class="favorite-button"
    :class="{ favorited: isFavorited }"
    :aria-label="ariaLabel"
    @click="handleClick"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      class="heart-icon"
      :fill="isFavorited ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFavorites } from '@/composables/useFavorites'

interface Props {
  locationId: string
}

const props = defineProps<Props>()
const { t } = useI18n()
const { isFavorite, toggleFavorite } = useFavorites()

const isFavorited = computed(() => isFavorite(props.locationId))

const ariaLabel = computed(() => {
  return isFavorited.value
    ? t('favorites.removeFromFavorites')
    : t('favorites.addToFavorites')
})

function handleClick() {
  toggleFavorite(props.locationId)
}
</script>

<style scoped>
.favorite-button {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.favorite-button:hover {
  transform: scale(1.1);
}

.heart-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #ef4444;
}

.favorite-button.favorited .heart-icon {
  color: #ef4444;
}
</style>
