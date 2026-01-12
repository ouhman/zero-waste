<template>
  <div class="tutorial">
    <!-- Mobile Hint -->
    <div v-if="isMobile" class="mobile-hint" data-testid="mobile-hint">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hint-icon">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <span>{{ t('submit.mobileHint') }}</span>
    </div>

    <!-- Tutorial Intro -->
    <div class="tutorial-intro">
      <h3 class="intro-title">{{ t('submit.tutorialIntro') }}</h3>
    </div>

    <!-- Tutorial Steps -->
    <div class="tutorial-steps">
      <!-- Step 1: Find the location -->
      <div class="tutorial-step">
        <div class="step-number">1</div>
        <div class="step-content">
          <h3 class="step-title">{{ t('submit.tutorialStep1') }}</h3>
          <p class="step-description">{{ t('submit.tutorialStep1Desc') }}</p>
        </div>
      </div>

      <!-- Step 2: Copy the link -->
      <div class="tutorial-step">
        <div class="step-number">2</div>
        <div class="step-content">
          <h3 class="step-title">{{ t('submit.tutorialStep2') }}</h3>
          <p class="step-description">{{ t('submit.tutorialStep2Desc') }}</p>
        </div>
      </div>

      <!-- Step 3: Paste the link -->
      <div class="tutorial-step">
        <div class="step-number">3</div>
        <div class="step-content">
          <h3 class="step-title">{{ t('submit.tutorialStep3') }}</h3>
        </div>
      </div>
    </div>

    <!-- Tutorial Video -->
    <div class="video-section" data-testid="tutorial-video">
      <VideoPlayer
        :sources="videoSources"
        default-quality="medium"
      />
    </div>

    <!-- CTA Button -->
    <div class="cta-section">
      <a
        href="https://maps.google.com"
        target="_blank"
        rel="noopener noreferrer"
        class="cta-button cursor-pointer"
        data-testid="open-google-maps"
        :aria-label="t('submit.openGoogleMaps')"
      >
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
        {{ t('submit.letsDoThis') }}
      </a>
    </div>

    <!-- URL Input -->
    <div class="url-input-section">
      <input
        v-model="googleMapsUrl"
        type="url"
        class="url-input"
        data-testid="url-input"
        :placeholder="t('submit.pasteLink')"
        :aria-label="t('submit.pasteLink')"
        @input="handleUrlInput"
      />
    </div>

    <!-- Back Button -->
    <div class="button-section">
      <button
        type="button"
        class="back-button cursor-pointer"
        data-testid="back-button"
        :aria-label="t('submit.back')"
        @click="handleBack"
        @keydown.enter="handleBack"
      >
        ← {{ t('submit.back') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import VideoPlayer from './VideoPlayer.vue'

const emit = defineEmits<{
  back: []
  'url-submitted': [url: string]
}>()

const { t } = useI18n()

const googleMapsUrl = ref('')

// Video sources for the tutorial
const videoSources = {
  low: '/videos/tutorial-480p.mp4',
  medium: '/videos/tutorial-720p.mp4',
  high: '/videos/tutorial-1080p.mp4'
}

// Detect mobile device
const isMobile = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|Android/i.test(navigator.userAgent)
})

function handleUrlInput() {
  if (googleMapsUrl.value.trim() !== '') {
    emit('url-submitted', googleMapsUrl.value)
  }
}

function handleBack() {
  emit('back')
}
</script>

<style scoped>
.tutorial {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.mobile-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: #92400e;
}

.hint-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.tutorial-intro {
  margin-bottom: 1.5rem;
}

.intro-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.tutorial-steps {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.tutorial-step {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.step-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}

.cta-section {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 200ms ease;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
}

.cta-button:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
}

.cta-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.cta-button .icon {
  width: 20px;
  height: 20px;
}

.video-section {
  margin-bottom: 2rem;
  border-radius: 12px;
  overflow: hidden;
}

.url-input-section {
  margin-bottom: 1.5rem;
}

.url-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.9375rem;
  transition: border-color 150ms, box-shadow 150ms;
  background: white;
}

.url-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}

.url-input::placeholder {
  color: #9ca3af;
}

.button-section {
  display: flex;
  justify-content: flex-start;
}

.back-button {
  padding: 0.75rem 1.25rem;
  background: transparent;
  color: #6b7280;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  transition: all 150ms ease;
}

.back-button:hover {
  color: #374151;
  background: #f3f4f6;
}

.back-button:active {
  background: #e5e7eb;
}

.cursor-pointer {
  cursor: pointer;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .tutorial-step {
    gap: 0.75rem;
  }

  .step-number {
    width: 28px;
    height: 28px;
    min-width: 28px;
    font-size: 13px;
  }

  .step-title {
    font-size: 0.9375rem;
  }

  .step-description {
    font-size: 0.8125rem;
  }
}
</style>
