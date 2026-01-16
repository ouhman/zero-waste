<template>
  <Teleport to="body">
    <!-- Backdrop (mobile only) -->
    <Transition name="fade">
      <div
        v-if="location"
        class="md:hidden fixed inset-0 bg-black/40 z-[1001]"
        @click="emit('close')"
      />
    </Transition>

    <!-- Panel -->
    <Transition :name="isMobile ? 'slide-up' : 'slide-right'">
      <div
        v-if="location"
        ref="panelRef"
        :class="[
          'fixed z-[1002] bg-white dark:bg-gray-900 shadow-2xl overflow-hidden flex flex-col',
          // Mobile: bottom sheet
          'bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl',
          // Desktop: right panel
          'md:top-0 md:right-0 md:bottom-0 md:left-auto md:w-[420px] md:max-h-none md:rounded-none'
        ]"
      >
        <!-- Drag handle (mobile) -->
        <div class="md:hidden flex justify-center py-3 cursor-grab" @mousedown="startDrag" @touchstart="startDrag">
          <div class="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        <!-- Header -->
        <div class="flex items-start justify-between px-5 pb-4 md:pt-5 border-b border-gray-100 dark:border-gray-700">
          <div class="flex-1 min-w-0 pr-4">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white leading-tight">{{ location.name }}</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ location.address }}, {{ location.city }}</p>
          </div>
          <button
            @click="emit('close')"
            class="p-2 -mr-2 -mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            :aria-label="t('common.close')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <div class="px-5 py-5 space-y-6">
            <!-- Categories -->
            <div v-if="categories.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="category in categories"
                :key="category.id"
                class="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium"
              >
                {{ category.name_de }}
              </span>
            </div>

            <!-- Description -->
            <div v-if="location.description_de">
              <p
                class="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line"
                v-html="formatDescription(location.description_de)"
              />
            </div>

            <!-- Opening Hours -->
            <OpeningHoursDisplay
              :hours="location.opening_hours_structured as StructuredOpeningHours | null"
              :osm-format="location.opening_hours_osm"
              :fallback-text="location.opening_hours_text"
              :always-open="isAlwaysOpen"
              @suggest-edit="openSuggestionModal"
            />

            <!-- Payment Methods -->
            <div v-if="hasPaymentMethods" class="flex gap-3">
              <span class="text-lg">💳</span>
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">{{ t('location.paymentMethods') }}</h3>
                <PaymentMethods
                  :payment-methods="location.payment_methods as PaymentMethodsType"
                  size="small"
                  layout="horizontal"
                  :show-label="false"
                />
              </div>
            </div>

            <!-- Contact Section -->
            <div v-if="hasContactInfo">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">{{ t('location.contact') }}</h3>
              <ContactInfo
                :website="location.website"
                :phone="location.phone"
                :email="location.email"
                :instagram="location.instagram"
                size="full"
                icon-style="emoji"
                text-class="text-sm"
              />
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-5 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div class="flex gap-3">
            <a
              :href="directionsUrl"
              target="_blank"
              rel="noopener"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              <span>🚲</span>
              {{ t('location.getDirections') }}
            </a>
            <button
              @click="shareLocation"
              class="px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              :aria-label="t('location.share')"
            >
              <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Hours Suggestion Modal -->
    <HoursSuggestionModal
      v-if="showSuggestionModal && location && location.slug"
      :location-id="location.id"
      :location-slug="location.slug"
      :location-name="location.name"
      :current-hours="location.opening_hours_structured as StructuredOpeningHours | null"
      :osm-format="location.opening_hours_osm"
      :website="location.website"
      :city="location.city"
      :suburb="location.suburb"
      @close="showSuggestionModal = false"
      @submitted="onSuggestionSubmitted"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import PaymentMethods from '@/components/PaymentMethods.vue'
import ContactInfo from '@/components/common/ContactInfo.vue'
import OpeningHoursDisplay from '@/components/common/OpeningHoursDisplay.vue'
import HoursSuggestionModal from '@/components/common/HoursSuggestionModal.vue'
import { useToast } from '@/composables/useToast'
import { useAnalytics } from '@/composables/useAnalytics'
import type { Database } from '@/types/database'
import type { PaymentMethods as PaymentMethodsType, StructuredOpeningHours } from '@/types/osm'

type Location = Database['public']['Tables']['locations']['Row'] & {
  location_categories?: {
    categories: Database['public']['Tables']['categories']['Row']
  }[]
}

interface Props {
  location: Location | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  share: [location: Location]
}>()

const { t } = useI18n()
const { success } = useToast()
const { trackLocationDetailView } = useAnalytics()
const panelRef = ref<HTMLElement | null>(null)
const isMobile = ref(false)
const showSuggestionModal = ref(false)

// Check if mobile
function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('keydown', handleEscape)
})

// Track location detail view when location changes
watch(
  () => props.location,
  (newLocation) => {
    if (newLocation?.slug) {
      const primaryCategory = categories.value[0]?.slug
      trackLocationDetailView(newLocation.slug, primaryCategory)
    }
  },
  { immediate: true }
)

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

// Check if location belongs to an "always open" category (e.g., Bücherschrank, Trinkbrunnen)
const isAlwaysOpen = computed(() => {
  return categories.value.some(cat => cat.always_open === true)
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

// Format description: convert URLs to clickable links
function formatDescription(text: string): string {
  // Escape HTML first to prevent XSS
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  // Convert URLs to clickable links
  const urlRegex = /(https?:\/\/[^\s<]+)/g
  return escaped.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener" class="text-blue-600 hover:underline">$1</a>')
}

// Directions URL
const directionsUrl = computed(() => {
  if (!props.location) return '#'
  return `https://www.google.com/maps/dir/?api=1&destination=${props.location.latitude},${props.location.longitude}&travelmode=bicycling`
})

// Share location - emit to parent to show ShareModal
function shareLocation() {
  if (!props.location) return
  emit('share', props.location)
}

// Open hours suggestion modal
function openSuggestionModal() {
  showSuggestionModal.value = true
}

// Handle successful suggestion submission
function onSuggestionSubmitted() {
  success(t('hoursSuggestion.successMessage'))
}

// Drag to dismiss (mobile)
let startY = 0
let currentY = 0

function startDrag(e: MouseEvent | TouchEvent) {
  if (!isMobile.value) return
  startY = 'touches' in e ? e.touches[0].clientY : e.clientY
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', endDrag)
}

function onDrag(e: MouseEvent | TouchEvent) {
  currentY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const delta = currentY - startY
  if (delta > 0 && panelRef.value) {
    panelRef.value.style.transform = `translateY(${delta}px)`
  }
}

function endDrag() {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', endDrag)

  const delta = currentY - startY
  if (delta > 100) {
    emit('close')
  }

  if (panelRef.value) {
    panelRef.value.style.transform = ''
  }
  startY = 0
  currentY = 0
}
</script>

<style scoped>
/* Slide from right (desktop) */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

/* Slide from bottom (mobile) */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* Fade for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
