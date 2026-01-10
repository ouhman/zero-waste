<template>
  <div class="loading-spinner" :aria-label="ariaLabel" role="status">
    <div class="spinner"></div>
    <span v-if="text" class="spinner-text">{{ text }}</span>
    <span class="sr-only">{{ ariaLabel }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  text?: string
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  ariaLabel: 'Loading'
})
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e5e7eb;
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner-text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
