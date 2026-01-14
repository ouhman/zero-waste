<template>
  <div
    v-if="isDevelopment"
    class="fixed bottom-4 left-4 z-50 rounded bg-amber-500 px-2 py-1 text-xs font-bold text-white shadow-lg"
  >
    DEV
  </div>
</template>

<script setup lang="ts">
import { isDevelopment } from '@/lib/supabase'
</script>
