<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <h1>Oops! Etwas ist schiefgelaufen</h1>
      <p class="error-message">{{ errorMessage }}</p>
      <div class="actions">
        <button @click="reload" class="btn-primary">
          Seite neu laden
        </button>
        <router-link to="/" class="btn-secondary">
          Zurück zur Startseite
        </router-link>
      </div>
      <details v-if="errorDetails" class="error-details">
        <summary>Technische Details</summary>
        <pre>{{ errorDetails }}</pre>
      </details>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')
const errorDetails = ref('')

onErrorCaptured((err, _instance, info) => {
  hasError.value = true
  errorMessage.value = err.message || 'Ein unbekannter Fehler ist aufgetreten'
  errorDetails.value = `${err.stack}\n\nInfo: ${info}`

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Error captured by boundary:', err)
    console.error('Component info:', info)
  }

  // Prevent error from propagating
  return false
})

function reload() {
  window.location.reload()
}
</script>

<style scoped>
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: #fee;
}

.error-content {
  max-width: 600px;
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #dc2626;
}

.error-content h1 {
  font-size: 1.5rem;
  color: #dc2626;
  margin-bottom: 1rem;
}

.error-message {
  color: #6b7280;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  display: inline-block;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-primary {
  background: #10b981;
  color: white;
}

.btn-primary:hover {
  background: #059669;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.error-details {
  margin-top: 1rem;
  font-size: 0.875rem;
}

.error-details summary {
  cursor: pointer;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.error-details pre {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 0.25rem;
  overflow-x: auto;
  font-size: 0.75rem;
  color: #374151;
}
</style>
