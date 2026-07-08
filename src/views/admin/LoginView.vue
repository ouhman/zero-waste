<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-center text-3xl font-extrabold text-gray-900">
          {{ t('admin.login.title') }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ step === 'request'
            ? t('admin.login.requestDescription')
            : t('admin.login.codeSentDescription', { email }) }}
        </p>
      </div>

      <!-- Step 1: request a code -->
      <form v-if="step === 'request'" class="mt-8 space-y-6" @submit.prevent="requestCode">
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
          class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
          :disabled="loading || !email.trim()"
        >
          {{ loading ? t('common.loading') : t('admin.login.sendCode') }}
        </button>
      </form>

      <!-- Step 2: enter the login code -->
      <form v-else class="mt-8 space-y-6" @submit.prevent="verifyCode">
        <div>
          <label for="code" class="sr-only">{{ t('admin.login.codeLabel') }}</label>
          <input
            id="code"
            ref="codeInput"
            v-model="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            pattern="[0-9]*"
            maxlength="8"
            required
            :aria-label="t('admin.login.codeLabel')"
            class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 text-center tracking-[0.5em] text-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            :placeholder="t('admin.login.codePlaceholder')"
            :disabled="loading"
          />
        </div>

        <div v-if="errorMessage" class="rounded-md bg-red-50 p-4" role="alert">
          <p class="text-sm text-red-800">{{ errorMessage }}</p>
        </div>

        <button
          type="submit"
          class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
          :disabled="loading || !isCodeValid"
        >
          {{ loading ? t('common.loading') : t('admin.login.verifyCode') }}
        </button>

        <div class="flex justify-between text-sm">
          <button
            type="button"
            class="text-blue-600 hover:text-blue-700 cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed"
            :disabled="loading"
            @click="resendCode"
          >
            {{ t('admin.login.resendCode') }}
          </button>
          <button
            type="button"
            class="text-gray-500 hover:text-gray-700 cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed"
            :disabled="loading"
            @click="changeEmail"
          >
            {{ t('admin.login.changeEmail') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/lib/supabase'

const { t } = useI18n()
const router = useRouter()

const email = ref('')
const code = ref('')
const step = ref<'request' | 'verify'>('request')
const loading = ref(false)
const errorMessage = ref('')
const codeInput = ref<HTMLInputElement | null>(null)

// Supabase's Email OTP length is a per-project setting (6–8 digits are common).
// Accept that whole range rather than hard-coding one length, so login works
// regardless of how a given project is configured and lets verifyOtp be the
// source of truth.
const isCodeValid = computed(() => /^\d{6,8}$/.test(code.value.trim()))

/**
 * Send an OTP code to the entered email.
 * Returns false (and sets errorMessage) if a blocking error occurred and the
 * caller should stay on the request step; true otherwise. To avoid revealing
 * whether an email belongs to an admin, we only actually send for admin emails
 * but report success either way.
 */
async function sendOtp(): Promise<boolean> {
  // App-level rate limit first (guards against admin-email guessing)
  const { data: allowed, error: rateError } = await supabase
    .rpc('check_rate_limit', { check_email: email.value } as never)

  if (rateError || !allowed) {
    errorMessage.value = t('admin.login.rateLimited')
    return false
  }

  // Only send to real admins, but never reveal the result to the caller
  const { data: isAdmin } = await supabase
    .rpc('is_admin_email', { check_email: email.value } as never)

  if (isAdmin) {
    // No emailRedirectTo: the email template delivers a numeric code, not a link.
    // shouldCreateUser:false avoids creating accounts for unknown addresses.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: { shouldCreateUser: false }
    })

    if (otpError) {
      errorMessage.value = otpError.status === 429
        ? t('admin.login.rateLimited')
        : t('admin.login.genericError')
      return false
    }
  }

  return true
}

async function requestCode() {
  loading.value = true
  errorMessage.value = ''

  try {
    if (await sendOtp()) {
      code.value = ''
      step.value = 'verify'
      await nextTick()
      codeInput.value?.focus()
    }
  } catch {
    errorMessage.value = t('admin.login.genericError')
  } finally {
    loading.value = false
  }
}

async function resendCode() {
  loading.value = true
  errorMessage.value = ''

  try {
    // Stay on the verify step regardless; sendOtp surfaces any rate-limit error
    await sendOtp()
  } catch {
    errorMessage.value = t('admin.login.genericError')
  } finally {
    loading.value = false
  }
}

async function verifyCode() {
  loading.value = true
  errorMessage.value = ''

  try {
    const { error } = await supabase.auth.verifyOtp({
      email: email.value,
      token: code.value.trim(),
      type: 'email'
    })

    if (error) {
      errorMessage.value = t('admin.login.codeError')
      return
    }

    // Session is now persisted by the Supabase client; the admin guard will
    // read it and verify app_metadata.role on navigation.
    await router.push('/bulk-station')
  } catch {
    errorMessage.value = t('admin.login.codeError')
  } finally {
    loading.value = false
  }
}

function changeEmail() {
  step.value = 'request'
  code.value = ''
  errorMessage.value = ''
}
</script>
