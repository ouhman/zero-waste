<template>
  <div class="relative">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      <span>{{ currentLocale.toUpperCase() }}</span>
      <svg
        :class="['w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform', { 'rotate-180': isOpen }]"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 mt-1 w-28 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
    >
      <button
        @click="switchLanguage('de')"
        :class="[
          'w-full px-3 py-2 text-left text-sm font-medium transition-colors',
          currentLocale === 'de'
            ? 'bg-green-50 text-green-700'
            : 'text-gray-700 hover:bg-gray-50'
        ]"
      >
        🇩🇪 Deutsch
      </button>
      <button
        @click="switchLanguage('en')"
        :class="[
          'w-full px-3 py-2 text-left text-sm font-medium transition-colors',
          currentLocale === 'en'
            ? 'bg-green-50 text-green-700'
            : 'text-gray-700 hover:bg-gray-50'
        ]"
      >
        🇬🇧 English
      </button>
    </div>

    <!-- Backdrop to close dropdown -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="isOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLanguage } from '@/plugins/i18n'

const { locale } = useI18n()

const isOpen = ref(false)
const currentLocale = computed(() => locale.value)

function switchLanguage(lang: 'de' | 'en') {
  setLanguage(lang)
  isOpen.value = false
}
</script>
