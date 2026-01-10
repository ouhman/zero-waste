<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <div class="error-icon">
        <svg
          class="w-16 h-16 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 class="error-title">{{ title || 'Something went wrong' }}</h2>
      <p class="error-message">{{ friendlyMessage }}</p>
      <div v-if="showDetails && errorDetails" class="error-details">
        <details>
          <summary>Error details</summary>
          <pre>{{ errorDetails }}</pre>
        </details>
      </div>
      <div class="error-actions">
        <button
          type="button"
          class="btn-primary"
          @click="handleRetry"
        >
          {{ retryText || 'Try Again' }}
        </button>
        <button
          v-if="showHome"
          type="button"
          class="btn-secondary"
          @click="goHome"
        >
          Go to Home
        </button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'

interface Props {
  title?: string
  retryText?: string
  showDetails?: boolean
  showHome?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
  showHome: true
})

const emit = defineEmits<{
  error: [error: Error]
  retry: []
}>()

const router = useRouter()
const hasError = ref(false)
const errorDetails = ref<string>('')
const friendlyMessage = ref<string>('')

onErrorCaptured((error: Error) => {
  hasError.value = true
  errorDetails.value = error.stack || error.toString()

  // Convert error to user-friendly message
  friendlyMessage.value = getFriendlyMessage(error)

  emit('error', error)

  // Prevent error from propagating
  return false
})

function getFriendlyMessage(error: Error): string {
  const message = error.message.toLowerCase()

  if (message.includes('network') || message.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.'
  }

  if (message.includes('not found') || message.includes('404')) {
    return 'The requested resource was not found.'
  }

  if (message.includes('unauthorized') || message.includes('403')) {
    return 'You are not authorized to access this resource.'
  }

  if (message.includes('timeout')) {
    return 'The request took too long. Please try again.'
  }

  // Default friendly message
  return 'An unexpected error occurred. Please try again.'
}

function handleRetry() {
  hasError.value = false
  errorDetails.value = ''
  friendlyMessage.value = ''
  emit('retry')
}

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
}

.error-content {
  max-width: 42rem;
  text-align: center;
}

.error-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.75rem;
}

.error-message {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 1.5rem;
}

.error-details {
  margin-bottom: 1.5rem;
  text-align: left;
}

.error-details details {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 1rem;
}

.error-details summary {
  cursor: pointer;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.error-details pre {
  margin: 0.5rem 0 0;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: #ef4444;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #f9fafb;
}
</style>
