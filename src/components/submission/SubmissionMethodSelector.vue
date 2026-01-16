<template>
  <div class="method-selector">
    <h2 class="heading">{{ t('submit.howToAdd') }}</h2>

    <div class="methods-grid">
      <!-- Google Maps Link Option -->
      <div
        data-testid="method-google-maps"
        role="button"
        tabindex="0"
        class="method-card cursor-pointer"
        :aria-label="t('submit.methodGoogleMaps') + ' - ' + t('submit.methodGoogleMapsDesc')"
        @click="selectMethod('google-maps')"
        @keydown.enter="selectMethod('google-maps')"
        @keydown.space.prevent="selectMethod('google-maps')"
      >
        <div class="icon-wrapper">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="icon"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
            />
          </svg>
        </div>
        <h3 class="method-title">{{ t('submit.methodGoogleMaps') }}</h3>
        <p class="method-description">{{ t('submit.methodGoogleMapsDesc') }}</p>
      </div>

      <!-- Pin on Map Option -->
      <div
        data-testid="method-pin-map"
        role="button"
        tabindex="0"
        class="method-card cursor-pointer"
        :aria-label="t('submit.methodPinMap') + ' - ' + t('submit.methodPinMapDesc')"
        @click="selectMethod('pin-map')"
        @keydown.enter="selectMethod('pin-map')"
        @keydown.space.prevent="selectMethod('pin-map')"
      >
        <div class="icon-wrapper">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="icon"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            />
          </svg>
        </div>
        <h3 class="method-title">{{ t('submit.methodPinMap') }}</h3>
        <p class="method-description">{{ t('submit.methodPinMapDesc') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAnalytics } from '@/composables/useAnalytics'

type SubmissionMethod = 'google-maps' | 'pin-map'

const emit = defineEmits<{
  select: [method: SubmissionMethod]
}>()

const { t } = useI18n()
const { trackSubmissionStarted } = useAnalytics()

function selectMethod(method: SubmissionMethod) {
  // Track submission started with the selected method
  const trackingMethod = method === 'google-maps' ? 'google_maps' : 'pin_on_map'
  trackSubmissionStarted(trackingMethod)

  emit('select', method)
}
</script>

<style scoped>
.method-selector {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.heading {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1.5rem 0;
  text-align: center;
  letter-spacing: -0.02em;
}

:global(.dark) .heading {
  color: #f3f4f6;
}

.methods-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .methods-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.method-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  transition: all 200ms ease;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

:global(.dark) .method-card {
  background: #1f2937;
  border-color: #374151;
}

.method-card:hover {
  border-color: #10b981;
  background: #f0fdf4;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.1);
}

:global(.dark) .method-card:hover {
  background: rgba(16, 185, 129, 0.1);
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2);
}

.method-card:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}

:global(.dark) .method-card:focus {
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
}

.method-card:active {
  transform: translateY(0);
}

.cursor-pointer {
  cursor: pointer;
}

.icon-wrapper {
  width: 64px;
  height: 64px;
  background: #ecfdf5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  transition: all 200ms ease;
}

:global(.dark) .icon-wrapper {
  background: rgba(16, 185, 129, 0.2);
}

.method-card:hover .icon-wrapper {
  background: #d1fae5;
  transform: scale(1.05);
}

:global(.dark) .method-card:hover .icon-wrapper {
  background: rgba(16, 185, 129, 0.3);
}

.icon {
  width: 32px;
  height: 32px;
  color: #10b981;
}

:global(.dark) .icon {
  color: #34d399;
}

.method-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

:global(.dark) .method-title {
  color: #f3f4f6;
}

.method-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

:global(.dark) .method-description {
  color: #9ca3af;
}

@media (max-width: 639px) {
  .heading {
    font-size: 1.25rem;
  }

  .method-card {
    min-height: 160px;
    padding: 1.25rem;
  }

  .icon-wrapper {
    width: 56px;
    height: 56px;
  }

  .icon {
    width: 28px;
    height: 28px;
  }

  .method-title {
    font-size: 1rem;
  }

  .method-description {
    font-size: 0.8125rem;
  }
}
</style>
