<template>
  <div class="not-found">
    <div class="content">
      <h1 class="title">404</h1>
      <h2 class="subtitle">{{ t('notFound.title') }}</h2>
      <p class="description">{{ t('notFound.description') }}</p>

      <div class="actions">
        <router-link to="/" class="btn-primary">
          {{ t('notFound.backHome') }}
        </router-link>
        <router-link to="/submit" class="btn-secondary">
          {{ t('notFound.submitLocation') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSeo } from '@/composables/useSeo'

const { t } = useI18n()

useSeo({
  title: '404 - Seite nicht gefunden - Zero Waste Frankfurt',
  description: 'Die angeforderte Seite wurde nicht gefunden.'
})
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.content {
  text-align: center;
  max-width: 600px;
  background: white;
  padding: 3rem 2rem;
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.title {
  font-size: 6rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.75rem;
  margin: 1rem 0;
  color: #1a202c;
}

.description {
  font-size: 1.125rem;
  color: #4a5568;
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  display: inline-block;
}

.btn-primary {
  background: #10b981;
  color: white;
}

.btn-primary:hover {
  background: #059669;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
  transform: translateY(-2px);
}

@media (max-width: 640px) {
  .title {
    font-size: 4rem;
  }

  .subtitle {
    font-size: 1.5rem;
  }

  .content {
    padding: 2rem 1.5rem;
  }

  .actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
