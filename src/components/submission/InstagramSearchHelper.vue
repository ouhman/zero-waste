<template>
  <div class="instagram-helper">
    <a
      :href="googleSearchUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="helper-link cursor-pointer"
      :aria-label="ariaLabel"
    >
      <svg
        class="search-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <span>{{ t('submit.helpFindInstagram') }}</span>
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  businessName: string
}

const props = defineProps<Props>()
const { t } = useI18n()

const googleSearchUrl = computed(() => {
  const query = encodeURIComponent(`${props.businessName} instagram`)
  return `https://www.google.com/search?q=${query}`
})

const ariaLabel = computed(() => {
  return `Search Google for ${props.businessName} Instagram account`
})
</script>

<style scoped>
.instagram-helper {
  margin-top: 8px;
}

.helper-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #9ca3af;
  text-decoration: none;
  transition: color 150ms;
}

.helper-link:hover {
  color: #6b7280;
  text-decoration: underline;
}

.search-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
</style>
