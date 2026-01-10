<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style>
/* Base styles moved to index.css @layer base for Tailwind v4 compatibility */
#app {
  min-height: 100vh;
}
</style>
