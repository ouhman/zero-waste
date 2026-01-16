<template>
  <div class="submit-page">
    <!-- Language Switcher & Dark Mode Toggle -->
    <div class="top-controls">
      <LanguageSwitcher />
      <button
        type="button"
        class="dark-mode-toggle cursor-pointer"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleDarkMode"
      >
        <!-- Sun icon (shown in dark mode) -->
        <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="toggle-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
        <!-- Moon icon (shown in light mode) -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="toggle-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      </button>
    </div>

    <div class="submit-container">
      <header class="submit-header">
        <router-link to="/" class="back-link">
          ← {{ t('common.back') }}
        </router-link>
        <h1>{{ t('submit.title') }}</h1>
        <p class="subtitle">{{ t('submit.subtitle') }}</p>
      </header>

      <div v-if="submitted" class="success-message">
        <div class="success-icon">✓</div>
        <h2>{{ t('submit.success') }}</h2>
        <p>{{ t('submit.checkEmail') }}</p>
        <router-link to="/" class="btn btn-primary">
          {{ t('common.backToMap') }}
        </router-link>
      </div>

      <div v-if="submissionError" class="error-message">
        <strong>{{ t('common.error') }}</strong>
        <p>{{ submissionError }}</p>
      </div>

      <LocationForm
        v-if="!submitted"
        mode="submit"
        :loading="submitting"
        @submit="handleSubmit"
      />

      <footer class="submit-footer">
        <p>{{ t('submit.info') }}</p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LocationForm from '@/components/LocationForm.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import { useSubmission } from '@/composables/useSubmission'
import { useAnalytics } from '@/composables/useAnalytics'
import { useDarkMode } from '@/composables/useDarkMode'

const { t } = useI18n()
// Initialize dark mode from localStorage/system preference
const { isDark, toggle: toggleDarkMode } = useDarkMode()
const { submit, loading: submitting, error: submissionError, success } = useSubmission()
const { trackSubmissionCompleted } = useAnalytics()

const submitted = ref(false)

async function handleSubmit(data: any) {
  // Extract the submission method before submitting
  const submissionMethod = data._submissionMethod as 'google_maps' | 'pin_on_map' | undefined

  await submit(data)

  if (success.value) {
    submitted.value = true
    // Track submission completion
    if (submissionMethod) {
      trackSubmissionCompleted(submissionMethod)
    }
  }
}
</script>

<style scoped>
.submit-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdfa 100%);
  padding: 2rem 1rem;
  position: relative;
}

:global(.dark) .submit-page {
  background: linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%);
}

.top-controls {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dark-mode-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
  transition: all 200ms ease;
}

:global(.dark) .dark-mode-toggle {
  background: #374151;
  border-color: #4b5563;
  color: #fbbf24;
}

.dark-mode-toggle:hover {
  background: #f3f4f6;
  color: #374151;
}

:global(.dark) .dark-mode-toggle:hover {
  background: #4b5563;
  color: #fcd34d;
}

.toggle-icon {
  width: 20px;
  height: 20px;
}

.submit-container {
  max-width: 640px;
  margin: 0 auto;
}

.submit-header {
  text-align: center;
  margin-bottom: 2rem;
}

.back-link {
  display: inline-block;
  color: #10b981;
  text-decoration: none;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: #059669;
}

:global(.dark) .back-link {
  color: #34d399;
}

:global(.dark) .back-link:hover {
  color: #6ee7b7;
}

.submit-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

:global(.dark) .submit-header h1 {
  color: #f3f4f6;
}

.subtitle {
  color: #64748b;
  font-size: 1rem;
}

:global(.dark) .subtitle {
  color: #9ca3af;
}

.success-message {
  background: white;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

:global(.dark) .success-message {
  background: #1f2937;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.success-icon {
  width: 64px;
  height: 64px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 1.5rem;
}

.success-message h2 {
  color: #1e293b;
  margin-bottom: 0.5rem;
}

:global(.dark) .success-message h2 {
  color: #f3f4f6;
}

.success-message p {
  color: #64748b;
  margin-bottom: 1.5rem;
}

:global(.dark) .success-message p {
  color: #9ca3af;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

:global(.dark) .error-message {
  background: rgba(127, 29, 29, 0.3);
  border-color: #991b1b;
  color: #fca5a5;
}

.error-message strong {
  display: block;
  margin-bottom: 0.25rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}

.btn-primary {
  background: #10b981;
  color: white;
}

.btn-primary:hover {
  background: #059669;
}

.submit-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

:global(.dark) .submit-footer {
  border-top-color: #374151;
}

.submit-footer p {
  color: #64748b;
  font-size: 0.875rem;
}

:global(.dark) .submit-footer p {
  color: #9ca3af;
}
</style>
