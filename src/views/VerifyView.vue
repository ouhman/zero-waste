<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-lg">
      <!-- Loading State -->
      <div v-if="verifying" class="text-center py-16">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
          <svg class="w-8 h-8 text-green-600 dark:text-green-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p class="text-gray-600 dark:text-gray-300 text-lg">{{ t('verify.verifying') }}</p>
      </div>

      <!-- Success State -->
      <div v-if="verified" class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <!-- Success Header -->
        <div class="bg-gradient-to-br from-green-600/90 to-emerald-700/90 dark:from-green-700/80 dark:to-emerald-800/80 px-8 py-10 text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/15 backdrop-blur-sm mb-5">
            <svg class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 16V7m0 4c0-3 0-6-7-6c0 3 0 6 7 6Zm-8 5h16m-2 0l-2 7H8l-2-7m6-9c0-3 0-6 7-6c0 3 0 6-7 6Z"/>
            </svg>
          </div>
          <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">{{ t('verify.successTitle') }}</h1>
          <p class="text-green-100/90 text-lg">{{ t('verify.successSubtitle') }}</p>
        </div>

        <!-- Content -->
        <div class="px-8 py-8">
          <!-- Thank You Message -->
          <div class="text-center mb-8">
            <p class="text-gray-700 dark:text-gray-200 text-lg leading-relaxed mb-4">
              {{ t('verify.thankYouMessage') }}
            </p>
            <p class="text-gray-600 dark:text-gray-400">
              {{ t('verify.reviewMessage') }}
            </p>
          </div>

          <!-- Divider -->
          <div class="border-t border-gray-200 dark:border-gray-700 my-6"></div>

          <!-- Community Message -->
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 mb-8">
            <h2 class="font-semibold text-gray-800 dark:text-gray-100 mb-2">{{ t('verify.communityTitle') }}</h2>
            <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {{ t('verify.communityMessage') }}
            </p>
          </div>

          <!-- CTA Button -->
          <router-link
            to="/"
            class="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-center py-4 px-6 rounded-xl transition-colors cursor-pointer"
          >
            {{ t('verify.exploreMap') }}
          </router-link>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="verificationError" class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div class="px-8 pt-10 pb-6 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-5">
            <svg class="w-8 h-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{{ t('verify.errorTitle') }}</h1>
          <p class="text-gray-500 dark:text-gray-400">{{ t('verify.errorSubtitle') }}</p>
        </div>

        <div class="px-8 pb-8">
          <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
            <p class="text-amber-800 dark:text-amber-200 text-sm">{{ verificationError }}</p>
          </div>

          <p class="text-gray-600 dark:text-gray-400 text-center text-sm mb-6">
            {{ t('verify.errorHelp') }}
          </p>

          <router-link
            to="/"
            class="block w-full bg-gray-800 hover:bg-gray-900 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-semibold text-center py-4 px-6 rounded-xl transition-colors cursor-pointer"
          >
            {{ t('verify.backToMap') }}
          </router-link>
        </div>
      </div>
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
