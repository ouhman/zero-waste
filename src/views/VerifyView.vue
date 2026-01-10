<template>
  <div class="container mx-auto px-4 py-8 max-w-2xl">
    <h1 class="text-3xl font-bold mb-6">{{ t('verify.title') }}</h1>

    <div v-if="verifying" class="text-center py-8">
      <p>{{ t('common.loading') }}...</p>
    </div>

    <div v-if="verified" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
      <p class="font-bold">{{ t('verify.success') }}</p>
      <p>{{ t('verify.successMessage') }}</p>
    </div>

    <div v-if="verificationError" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <p class="font-bold">{{ t('common.error') }}</p>
      <p>{{ verificationError }}</p>
    </div>

    <div class="mt-6">
      <router-link to="/" class="text-blue-600 hover:underline">
        {{ t('verify.backToMap') }}
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()

const verifying = ref(true)
const verified = ref(false)
const verificationError = ref<string | null>(null)

onMounted(async () => {
  const token = route.query.token as string

  if (!token) {
    verificationError.value = t('verify.missingToken')
    verifying.value = false
    return
  }

  try {
    // Get Supabase URL from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured')
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/verify-submission`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ token })
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Verification failed')
    }

    verified.value = true
  } catch (e) {
    verificationError.value = e instanceof Error ? e.message : 'Verification error occurred'
  } finally {
    verifying.value = false
  }
})
</script>
