<template>
  <div class="submit-page">
    <!-- Language Switcher -->
    <div class="language-switcher-container">
      <LanguageSwitcher />
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

const { t } = useI18n()
const { submit, loading: submitting, error: submissionError, success } = useSubmission()

const submitted = ref(false)

async function handleSubmit(data: any) {
  await submit(data)

  if (success.value) {
    submitted.value = true
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

.language-switcher-container {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
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

.submit-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #64748b;
  font-size: 1rem;
}

.success-message {
  background: white;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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

.success-message p {
  color: #64748b;
  margin-bottom: 1.5rem;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
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

.submit-footer p {
  color: #64748b;
  font-size: 0.875rem;
}
</style>
