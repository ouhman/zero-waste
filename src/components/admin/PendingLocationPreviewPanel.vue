<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div
      v-if="location"
      class="fixed inset-0 bg-black/40 z-[1001]"
      @click="emit('close')"
    />
  </Transition>

  <!-- Panel -->
  <Transition name="slide-right">
    <div
      v-if="location"
      class="fixed top-0 right-0 bottom-0 w-full max-w-lg z-[1002] bg-white shadow-2xl overflow-hidden flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-start justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
        <div class="flex-1 min-w-0 pr-4">
          <h2 class="text-xl font-bold text-gray-900 leading-tight">{{ location.name }}</h2>
          <p class="text-sm text-gray-500 mt-1">{{ location.address }}, {{ location.city }}</p>
        </div>
        <button
          @click="emit('close')"
          class="p-2 -mr-2 -mt-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto">
        <div class="px-5 py-5 space-y-6">
          <!-- Submission Info Banner -->
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div class="flex items-center gap-2 text-amber-800 font-medium mb-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ t('admin.preview.pendingReview') }}
            </div>
            <div class="text-sm text-amber-700 space-y-1">
              <p><span class="font-medium">{{ t('submit.email') }}:</span> {{ location.submitted_by_email || '-' }}</p>
              <p><span class="font-medium">{{ t('common.created') }}:</span> {{ formatDateTime(location.created_at) }}</p>
              <p v-if="location.submission_type"><span class="font-medium">{{ t('admin.preview.type') }}:</span> {{ location.submission_type }}</p>
            </div>
          </div>

          <!-- Categories -->
          <div v-if="categories.length > 0">
            <h3 class="text-sm font-semibold text-gray-900 mb-2">{{ t('location.categories') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="category in categories"
                :key="category.id"
                class="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium"
              >
                {{ category.name_de }}
              </span>
            </div>
          </div>

          <!-- Description -->
          <div v-if="location.description_de || location.description_en">
            <h3 class="text-sm font-semibold text-gray-900 mb-2">{{ t('submit.description') }}</h3>
            <div v-if="location.description_de" class="mb-2">
              <span class="text-xs text-gray-500 uppercase">DE</span>
              <p class="text-gray-600 text-sm whitespace-pre-line">{{ location.description_de }}</p>
            </div>
            <div v-if="location.description_en">
              <span class="text-xs text-gray-500 uppercase">EN</span>
              <p class="text-gray-600 text-sm whitespace-pre-line">{{ location.description_en }}</p>
            </div>
          </div>

          <!-- Address & Coordinates -->
          <div>
            <h3 class="text-sm font-semibold text-gray-900 mb-2">{{ t('admin.form.addressGeo') }}</h3>
            <div class="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              <div class="flex gap-2">
                <span class="text-gray-500 w-20">{{ t('admin.form.address') }}:</span>
                <span class="text-gray-900">{{ location.address }}</span>
              </div>
              <div class="flex gap-2">
                <span class="text-gray-500 w-20">{{ t('admin.form.postalCode') }}:</span>
                <span class="text-gray-900">{{ location.postal_code || '-' }}</span>
              </div>
              <div class="flex gap-2">
                <span class="text-gray-500 w-20">{{ t('admin.form.city') }}:</span>
                <span class="text-gray-900">{{ location.city }}</span>
              </div>
              <div class="flex gap-2 pt-2 border-t border-gray-200">
                <span class="text-gray-500 w-20">{{ t('admin.form.latitude') }}:</span>
                <span class="text-gray-900 font-mono text-xs">{{ location.latitude }}</span>
              </div>
              <div class="flex gap-2">
                <span class="text-gray-500 w-20">{{ t('admin.form.longitude') }}:</span>
                <span class="text-gray-900 font-mono text-xs">{{ location.longitude }}</span>
              </div>
              <a
                :href="googleMapsUrl"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-1 text-blue-600 hover:underline mt-2 cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {{ t('admin.preview.viewOnGoogleMaps') }}
              </a>
            </div>
          </div>

          <!-- Opening Hours -->
          <div v-if="location.opening_hours_text">
            <h3 class="text-sm font-semibold text-gray-900 mb-2">{{ t('location.openingHours') }}</h3>
            <p class="text-gray-600 text-sm whitespace-pre-line bg-gray-50 rounded-lg p-3">{{ location.opening_hours_text }}</p>
          </div>

          <!-- Payment Methods -->
          <div v-if="hasPaymentMethods">
            <h3 class="text-sm font-semibold text-gray-900 mb-2">{{ t('location.paymentMethods') }}</h3>
            <PaymentMethods
              :payment-methods="location.payment_methods as PaymentMethodsType"
              size="small"
              layout="horizontal"
              :show-label="true"
            />
          </div>

          <!-- Contact Info -->
          <div v-if="hasContactInfo">
            <h3 class="text-sm font-semibold text-gray-900 mb-2">{{ t('location.contact') }}</h3>
            <div class="space-y-2">
              <a
                v-if="location.website"
                :href="location.website"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <span class="text-lg">🌐</span>
                <span class="text-sm text-blue-600 hover:underline truncate">{{ formatUrl(location.website) }}</span>
              </a>

              <a
                v-if="location.phone"
                :href="`tel:${location.phone}`"
                class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <span class="text-lg">📞</span>
                <span class="text-sm text-gray-700">{{ location.phone }}</span>
              </a>

              <a
                v-if="location.email"
                :href="`mailto:${location.email}`"
                class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <span class="text-lg">✉️</span>
                <span class="text-sm text-gray-700">{{ location.email }}</span>
              </a>

              <a
                v-if="location.instagram"
                :href="`https://instagram.com/${location.instagram.replace('@', '')}`"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <span class="text-lg">📸</span>
                <span class="text-sm text-gray-700">{{ location.instagram }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="px-5 py-4 border-t border-gray-200 bg-gray-50">
        <div class="flex gap-3">
          <button
            @click="emit('approve', location.id)"
            :disabled="loading"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ t('admin.approve') }}
          </button>
          <button
            @click="emit('reject', location.id)"
            :disabled="loading"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {{ t('admin.reject') }}
          </button>
        </div>
        <router-link
          :to="`/bulk-station/edit/${location.id}`"
          class="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {{ t('admin.editButton') }}
        </router-link>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import PaymentMethods from '@/components/PaymentMethods.vue'
import type { Database } from '@/types/database'
import type { PaymentMethods as PaymentMethodsType } from '@/types/osm'

type Location = Database['public']['Tables']['locations']['Row'] & {
  location_categories?: {
    categories: Database['public']['Tables']['categories']['Row']
  }[]
}

interface Props {
  location: Location | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  close: []
  approve: [locationId: string]
  reject: [locationId: string]
}>()

const { t } = useI18n()

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.location) {
    emit('close')
  }
}

// Extract categories
const categories = computed(() => {
  if (!props.location?.location_categories) return []
  return props.location.location_categories
    .map(lc => lc.categories)
    .filter(Boolean)
})

// Check if payment methods exist
const hasPaymentMethods = computed(() => {
  const pm = props.location?.payment_methods
  if (!pm || typeof pm !== 'object') return false
  return Object.values(pm).some(v => v === true)
})

// Check if any contact info exists
const hasContactInfo = computed(() => {
  if (!props.location) return false
  return !!(
    props.location.website ||
    props.location.phone ||
    props.location.email ||
    props.location.instagram
  )
})

// Google Maps URL
const googleMapsUrl = computed(() => {
  if (!props.location) return '#'
  return `https://www.google.com/maps/search/?api=1&query=${props.location.latitude},${props.location.longitude}`
})

// Format URL for display
function formatUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

// Format date and time
function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString()
}
</script>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
