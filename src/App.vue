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
  display: flex;
  flex-direction: column;
  height: 100vh;   /* fallback for browsers without dynamic viewport units */
  height: 100dvh;  /* match the *visible* viewport on mobile (excludes the address bar) */
  overflow: hidden;
}

/* Allow RouterView content to fill available space */
#app > :first-child {
  flex: 1 1 0%;
  min-height: 0;
  overflow: auto;
}
</style>
