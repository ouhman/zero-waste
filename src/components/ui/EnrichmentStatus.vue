<template>
  <div
    class="enrichment-status"
    role="status"
    :aria-live="loading ? 'polite' : 'off'"
    :aria-busy="loading"
  >
    <LoadingSpinner v-if="loading" :aria-label="statusText" />

    <div class="status-content">
      <p class="status-message">{{ statusText }}</p>

      <ul v-if="loading && foundItems.length > 0" class="found-items" aria-live="polite">
        <li v-for="item in foundItems" :key="item" class="found-item">
          <span class="check-icon" aria-hidden="true">✓</span>
          <span>{{ item }}</span>
        </li>
      </ul>

      <div v-if="!loading && error" class="error-message" role="alert">
        <span class="error-icon" aria-hidden="true">⚠️</span>
        <span>{{ error }}</span>
      </div>

      <div v-else-if="!loading && success && summary" class="success-message">
        <span class="success-icon" aria-hidden="true">✓</span>
        <span>{{ summary }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LoadingSpinner from './LoadingSpinner.vue'

interface Props {
  loading: boolean
  foundPhone?: boolean
  foundWebsite?: boolean
  foundEmail?: boolean
  foundHours?: boolean
  foundInstagram?: boolean
  success?: boolean
  summary?: string
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  foundPhone: false,
  foundWebsite: false,
  foundEmail: false,
  foundHours: false,
  foundInstagram: false,
  success: false,
  summary: '',
  error: ''
})

const { t } = useI18n()

const statusText = computed(() => {
  if (props.loading) {
    return t('submit.researchingLocation')
  }
  if (props.error) {
    return props.error
  }
  if (props.success && props.summary) {
    return props.summary
  }
  return ''
})

const foundItems = computed(() => {
  const items: string[] = []

  if (props.foundPhone) {
    items.push(t('submit.foundPhone'))
  }
  if (props.foundWebsite) {
    items.push(t('submit.foundWebsite'))
  }
  if (props.foundEmail) {
    items.push(t('submit.foundEmail'))
  }
  if (props.foundHours) {
    items.push(t('submit.foundHours'))
  }
  if (props.foundInstagram) {
    items.push(t('submit.foundInstagram'))
  }

  return items
})
</script>

<style scoped>
.enrichment-status {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-message {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
  text-align: center;
}

.found-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.found-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #10b981;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.check-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #d1fae5;
  border-radius: 50%;
  font-size: 12px;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #10b981;
  font-weight: 500;
  justify-content: center;
}

.success-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #d1fae5;
  border-radius: 50%;
  font-size: 14px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #ef4444;
  font-weight: 500;
  justify-content: center;
  padding: 12px;
  background: #fef2f2;
  border-radius: 8px;
}

.error-icon {
  flex-shrink: 0;
}
</style>
