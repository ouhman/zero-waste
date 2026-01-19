<template>
  <div class="relative">
    <!-- Cog Icon Trigger Button -->
    <button
      @click="toggleDropdown"
      class="flex items-center justify-center w-9 h-9 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
      :aria-label="t('settings.label')"
      aria-haspopup="true"
      :aria-expanded="isOpen"
    >
      <!-- Heroicons: cog-6-tooth (outline) -->
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <!-- Dropdown Panel -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-4 px-4 z-50"
      >
        <!-- Language Section -->
        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {{ t('settings.language') }}
          </label>
          <div class="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
            <button
              @click="switchLanguage('de')"
              :class="[
                'flex-1 py-2 text-sm font-medium transition-colors cursor-pointer',
                currentLocale === 'de'
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
              ]"
              :aria-pressed="currentLocale === 'de'"
            >
              🇩🇪 DE
            </button>
            <button
              @click="switchLanguage('en')"
              :class="[
                'flex-1 py-2 text-sm font-medium transition-colors cursor-pointer border-l border-gray-200 dark:border-gray-600',
                currentLocale === 'en'
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
              ]"
              :aria-pressed="currentLocale === 'en'"
            >
              🇬🇧 EN
            </button>
          </div>
        </div>

        <!-- Divider -->
        <hr class="border-gray-200 dark:border-gray-600 mb-4">

        <!-- Appearance Section -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {{ t('settings.appearance') }}
          </label>
          <div class="flex items-center justify-between">
            <!-- Sun Icon -->
            <span class="text-xl" :class="{ 'opacity-50': isDark }">☀️</span>

            <!-- Toggle Switch -->
            <button
              @click="toggleDarkMode"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer',
                isDark ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
              ]"
              role="switch"
              :aria-checked="isDark"
              :aria-label="t('settings.appearance')"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  isDark ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
            </button>

            <!-- Moon Icon -->
            <span class="text-xl" :class="{ 'opacity-50': !isDark }">🌙</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Backdrop to close dropdown -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="closeDropdown"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLanguage } from '@/plugins/i18n'
import { useDarkMode } from '@/composables/useDarkMode'

const { t, locale } = useI18n()
const { isDark, toggle } = useDarkMode()

const isOpen = ref(false)
const currentLocale = computed(() => locale.value)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function switchLanguage(lang: 'de' | 'en') {
  setLanguage(lang)
  closeDropdown()
}

function toggleDarkMode() {
  toggle()
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    closeDropdown()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>
