<template>
  <div :class="['spinner-container', containerClass]">
    <div :class="['spinner', sizeClass]" role="status">
      <span class="sr-only">{{ text || 'Loading...' }}</span>
    </div>
    <p v-if="text" class="spinner-text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  centered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  centered: false
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'spinner-sm'
    case 'lg': return 'spinner-lg'
    default: return 'spinner-md'
  }
})

const containerClass = computed(() => ({
  'spinner-centered': props.centered
}))
</script>

<style scoped>
.spinner-container {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.spinner-centered {
  width: 100%;
  padding: 3rem 0;
  justify-content: center;
}

.spinner {
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-sm {
  width: 1.5rem;
  height: 1.5rem;
  border-width: 2px;
}

.spinner-md {
  width: 2.5rem;
  height: 2.5rem;
  border-width: 3px;
}

.spinner-lg {
  width: 4rem;
  height: 4rem;
  border-width: 4px;
}

.spinner-text {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
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

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
