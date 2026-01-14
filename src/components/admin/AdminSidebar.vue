<template>
  <!-- Mobile overlay -->
  <div
    v-if="open"
    class="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
    @click="$emit('close')"
  ></div>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed lg:sticky top-0 left-0 z-50 lg:z-0 h-screen w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out',
      open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <nav class="flex flex-col h-full p-4">
      <!-- Close button (mobile only) -->
      <button
        @click="$emit('close')"
        class="lg:hidden self-end p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 mb-4 cursor-pointer"
        aria-label="Close sidebar"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div class="space-y-1">
        <router-link
          to="/bulk-station"
          exact
          class="nav-link"
          :class="{ 'nav-link-active': $route.path === '/bulk-station' }"
          @click="$emit('close')"
        >
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {{ t('admin.nav.dashboard') }}
        </router-link>

        <router-link
          to="/bulk-station/locations"
          class="nav-link"
          :class="{ 'nav-link-active': $route.path.startsWith('/bulk-station/locations') || $route.path.startsWith('/bulk-station/pending') || $route.path.startsWith('/bulk-station/edit') }"
          @click="$emit('close')"
        >
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {{ t('admin.nav.locations') }}
        </router-link>

        <router-link
          to="/bulk-station/categories"
          class="nav-link"
          :class="{ 'nav-link-active': $route.path.startsWith('/bulk-station/categories') }"
          @click="$emit('close')"
        >
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {{ t('admin.nav.categories') }}
        </router-link>

        <router-link
          to="/bulk-station/hours-suggestions"
          class="nav-link"
          :class="{ 'nav-link-active': $route.path.startsWith('/bulk-station/hours-suggestions') }"
          @click="$emit('close')"
        >
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ t('admin.nav.hoursSuggestions') }}
          <span
            v-if="pendingSuggestionsCount > 0"
            class="ml-auto px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full"
          >
            {{ pendingSuggestionsCount }}
          </span>
        </router-link>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/stores/admin'

defineProps<{
  open: boolean
}>()

defineEmits<{
  close: []
}>()

const { t } = useI18n()
const adminStore = useAdminStore()

const pendingSuggestionsCount = computed(() => adminStore.pendingSuggestionsCount)

onMounted(async () => {
  await adminStore.fetchPendingSuggestionsCount()
})
</script>

<style scoped>
@reference "@/index.css";

.nav-link {
  @apply flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer;
}

.nav-link-active {
  @apply bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800;
}

.nav-icon {
  @apply h-5 w-5;
}
</style>
