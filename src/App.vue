<template>
  <div id="app">
    <RouterView />
    <ToastContainer />
    <CookieConsentBanner />
    <EnvironmentBadge />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import ToastContainer from '@/components/common/ToastContainer.vue'
import CookieConsentBanner from '@/components/common/CookieConsentBanner.vue'
import EnvironmentBadge from '@/components/common/EnvironmentBadge.vue'
import { useConsent } from '@/composables/useConsent'
import { initAnalytics } from '@/composables/useAnalytics'
import { useDarkMode } from '@/composables/useDarkMode'

const { loadConsent } = useConsent()
// Initialize dark mode globally - reads from localStorage/system preference
useDarkMode()

onMounted(async () => {
  loadConsent()
  await initAnalytics()
})
</script>

<style>
/* Base styles moved to index.css @layer base for Tailwind v4 compatibility */
#app {
  min-height: 100vh;
}
</style>
