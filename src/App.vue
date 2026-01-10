<template>
  <div id="app">
    <RouterView />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import ToastContainer from '@/components/common/ToastContainer.vue'
</script>

<style>
/* Base styles moved to index.css @layer base for Tailwind v4 compatibility */
#app {
  min-height: 100vh;
}
</style>
