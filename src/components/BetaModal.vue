<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 z-[1003]"
        @click="emit('close')"
      />
    </Transition>

    <!-- Modal -->
    <Transition name="scale">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[1004] flex items-center justify-center p-4"
        @click.self="emit('close')"
      >
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('beta.title') }}
            </h2>
            <button
              @click="emit('close')"
              class="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
              :aria-label="t('common.close')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="px-5 py-6 space-y-6">
            <!-- Beta Status Explanation -->
            <div class="space-y-3 text-gray-600 dark:text-gray-300">
              <p>
                {{ t('beta.subtitle') }}
              </p>
            </div>

            <!-- What is this? -->
            <div class="space-y-2">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ t('beta.whatIsThisTitle') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-300">
                {{ t('beta.whatIsThisText') }}
              </p>
            </div>

            <!-- Why we're building this -->
            <div class="space-y-2">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ t('beta.whyBuildingTitle') }}
              </h3>
              <div class="space-y-2 text-gray-600 dark:text-gray-300">
                <p>
                  {{ t('beta.whyBuildingText') }}
                </p>
                <p>
                  {{ t('beta.sideProject') }}
                </p>
              </div>
            </div>

            <!-- Inspirational quote -->
            <div class="text-center py-2">
              <p class="text-sm italic text-gray-500 dark:text-gray-400">
                {{ t('beta.everyStep') }}
              </p>
            </div>

            <!-- Thanks message -->
            <p class="text-center text-sm text-gray-500 dark:text-gray-400">
              {{ t('beta.thanks') }}
            </p>

            <!-- Feedback Toggle -->
            <div v-if="!showFeedbackForm && formState === 'default'" class="text-center">
              <button
                @click="showFeedbackForm = true"
                class="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:underline cursor-pointer transition-colors"
              >
                {{ t('beta.feedbackToggle') }}
              </button>
            </div>

            <!-- Divider (only when form is shown) -->
            <div v-if="showFeedbackForm || formState === 'success' || formState === 'rateLimited'" class="border-t border-gray-200 dark:border-gray-700"></div>

            <!-- Feedback Form -->
            <div v-if="showFeedbackForm && (formState === 'default' || formState === 'submitting')" class="space-y-4">
              <div class="space-y-2">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  {{ t('beta.feedbackTitle') }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  {{ t('beta.feedbackSubtitle') }}
                </p>
              </div>

              <!-- Message Textarea -->
              <div class="space-y-2">
                <label for="beta-message" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('beta.messageLabelRequired') }} <span class="text-red-500">*</span>
                </label>
                <textarea
                  id="beta-message"
                  v-model="message"
                  rows="4"
                  :placeholder="t('beta.feedbackPlaceholder')"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  :class="{ 'border-red-500 dark:border-red-500': showValidation && !isMessageValid }"
                ></textarea>
                <p v-if="showValidation && !isMessageValid" class="text-sm text-red-500">
                  {{ t('beta.messageRequired') }}
                </p>
              </div>

              <!-- Email Input -->
              <div class="space-y-2">
                <label for="beta-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('beta.emailLabel') }} <span class="text-gray-400 text-xs">{{ t('beta.emailLabelOptional') }}</span>
                </label>
                <input
                  id="beta-email"
                  v-model="email"
                  type="email"
                  :placeholder="t('beta.emailPlaceholder')"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <!-- Submit Button -->
              <button
                @click="handleSubmit"
                :disabled="formState === 'submitting'"
                class="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                <span v-if="formState === 'submitting'">
                  <!-- Loading spinner -->
                  <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ t('common.loading') }}
                </span>
                <span v-else>{{ t('beta.submit') }}</span>
              </button>
            </div>

            <!-- Success State -->
            <div v-if="formState === 'success'" class="space-y-4 text-center">
              <div class="flex justify-center">
                <div class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ t('beta.successTitle') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-300">
                {{ t('beta.successMessage') }}
              </p>
              <button
                @click="emit('close')"
                class="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors cursor-pointer"
              >
                {{ t('beta.close') }}
              </button>
            </div>

            <!-- Rate Limited State -->
            <div v-if="formState === 'rateLimited'" class="space-y-4 text-center">
              <div class="flex justify-center">
                <div class="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <svg class="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ t('beta.rateLimitTitle') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-300">
                {{ t('beta.rateLimitMessage', { seconds: remainingTime }) }}
              </p>
              <button
                @click="emit('close')"
                class="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors cursor-pointer"
              >
                {{ t('beta.close') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFeedback } from '@/composables/useFeedback'

const { t } = useI18n()

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

// Use feedback composable
const {
  error: feedbackError,
  rateLimitExceeded,
  rateLimitRemaining,
  submitFeedback,
  checkRateLimit,
} = useFeedback()

// Form state management
type FormState = 'default' | 'submitting' | 'success' | 'rateLimited'
const formState = ref<FormState>('default')
const showFeedbackForm = ref(false)
const message = ref('')
const email = ref('')
const showValidation = ref(false)
const remainingTime = ref(0)

// Validation
const isMessageValid = computed(() => {
  return message.value.trim().length >= 10
})

// Check rate limit when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    const isRateLimited = checkRateLimit()
    if (isRateLimited) {
      formState.value = 'rateLimited'
      remainingTime.value = rateLimitRemaining.value
      startCountdown()
    } else {
      formState.value = 'default'
      showFeedbackForm.value = false
    }
  }
})

// Countdown timer for rate limit
let countdownInterval: ReturnType<typeof setInterval> | undefined

function startCountdown() {
  // Clear existing interval if any
  if (countdownInterval !== undefined) {
    clearInterval(countdownInterval)
  }

  countdownInterval = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
    } else {
      clearInterval(countdownInterval!)
      formState.value = 'default'
    }
  }, 1000)
}

// Handle form submission
async function handleSubmit() {
  showValidation.value = true

  if (!isMessageValid.value) {
    return
  }

  // Check rate limit before submission
  const isRateLimited = checkRateLimit()
  if (isRateLimited) {
    formState.value = 'rateLimited'
    remainingTime.value = rateLimitRemaining.value
    startCountdown()
    return
  }

  formState.value = 'submitting'

  const result = await submitFeedback(
    message.value.trim(),
    email.value.trim() || undefined
  )

  if (result.success) {
    formState.value = 'success'
    // Reset form
    message.value = ''
    email.value = ''
    showValidation.value = false
  } else {
    // Handle error
    if (rateLimitExceeded.value) {
      formState.value = 'rateLimited'
      remainingTime.value = rateLimitRemaining.value
      startCountdown()
    } else {
      // Show error message but stay in default state
      formState.value = 'default'
      // Error message is available in feedbackError.value
      console.error('Feedback submission error:', feedbackError.value)
    }
  }
}

// ESC key to close
function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  // Clean up countdown interval
  if (countdownInterval !== undefined) {
    clearInterval(countdownInterval)
  }
})
</script>

<style scoped>
/* Scale transition for modal */
.scale-enter-active,
.scale-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.95);
  opacity: 0;
}

/* Fade for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
