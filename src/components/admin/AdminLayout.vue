<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <button
              @click="sidebarOpen = !sidebarOpen"
              class="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Toggle sidebar"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 class="ml-4 lg:ml-0 text-xl font-bold text-gray-900">
              {{ t('map.title') }} - Admin
            </h1>
          </div>

          <div class="flex items-center gap-4">
            <span v-if="user" class="text-sm text-gray-600">
              {{ user.email }}
            </span>
            <button
              @click="handleLogout"
              class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              {{ t('admin.logout') }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- Sidebar -->
      <AdminSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

      <!-- Main Content -->
      <main class="flex-1 p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import AdminSidebar from './AdminSidebar.vue'

const { t } = useI18n()
const { user, logout } = useAuth()

const sidebarOpen = ref(false)

async function handleLogout() {
  await logout()
}
</script>
