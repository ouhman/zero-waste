<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-center text-3xl font-extrabold text-gray-900">
          {{ t('admin.login.title') }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ t('admin.login.magicLinkDescription') }}
        </p>
      </div>

      <!-- Success state - always show generic message -->
      <div v-if="emailSent" class="rounded-md bg-green-50 p-4">
        <p class="text-sm text-green-800">
          {{ t('admin.login.checkEmailGeneric') }}
        </p>
      </div>

      <!-- Form state -->
      <form v-else class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div>
          <label for="email" class="sr-only">{{ t('admin.login.email') }}</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            :placeholder="t('admin.login.email')"
            :disabled="loading"
          />
        </div>

        <div v-if="errorMessage" class="rounded-md bg-red-50 p-4" role="alert">
          <p class="text-sm text-red-800">{{ errorMessage }}</p>
        </div>

        <button
          type="submit"
          class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          :disabled="loading || !email.trim()"
        >
          {{ loading ? t('common.loading') : t('admin.login.sendLink') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/lib/supabase'

const { t } = useI18n()

const email = ref('')
const loading = ref(false)
const errorMessage = ref('')
const emailSent = ref(false)

async function handleLogin() {
  loading.value = true
  errorMessage.value = ''

  try {
    // Check rate limit first (prevents brute force guessing of admin emails)
    const { data: allowed, error: rateError } = await supabase
      .rpc('check_rate_limit', { check_email: email.value } as never)

    if (rateError || !allowed) {
      errorMessage.value = t('admin.login.rateLimited')
      return
    }

    // Check if email belongs to an admin user
    // We don't reveal the result to the user for security
    const { data: isAdmin } = await supabase
      .rpc('is_admin_email', { check_email: email.value } as never)

    // Only send magic link if email is actually an admin
    // But always show success message to prevent email enumeration
    if (isAdmin) {
      await supabase.auth.signInWithOtp({
        email: email.value,
        options: {
          emailRedirectTo: `${window.location.origin}/bulk-station`
        }
      })
    }

    // Always show success message (security: don't reveal if email is admin)
    emailSent.value = true
  } catch (e) {
    // Generic error - don't expose internal errors
    errorMessage.value = t('admin.login.genericError')
  } finally {
    loading.value = false
  }
}
</script>
