<template>
  <Transition name="slide-up">
    <div
      v-if="showBanner"
      class="cookie-banner"
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-description"
    >
      <div class="cookie-content">
        <div class="cookie-text">
          <h2 id="cookie-title" class="cookie-title">
            {{ t('consent.title') }}
          </h2>
          <p id="cookie-description" class="cookie-description">
            {{ t('consent.description') }}
          </p>
        </div>
        <div class="cookie-actions">
          <button
            class="btn btn-secondary"
            @click="decline"
          >
            {{ t('consent.decline') }}
          </button>
          <button
            class="btn btn-primary"
            @click="accept"
          >
            {{ t('consent.accept') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useConsent } from '@/composables/useConsent'

const { t } = useI18n()
const { showBanner, acceptAnalytics, declineAnalytics } = useConsent()

function accept(): void {
  acceptAnalytics()
}

function decline(): void {
  declineAnalytics()
}
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: white;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -4px 6px -1px rgb(0 0 0 / 0.1);
  padding: 1rem;
}

.cookie-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .cookie-content {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.cookie-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #1f2937;
}

.cookie-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.cookie-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary {
  background: #16a34a;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #15803d;
}

.btn-secondary {
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f3f4f6;
}

/* Transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
