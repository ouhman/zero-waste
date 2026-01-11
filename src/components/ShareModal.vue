<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="location"
        class="fixed inset-0 bg-black/50 z-[1003]"
        @click="emit('close')"
      />
    </Transition>

    <!-- Modal -->
    <Transition name="scale">
      <div
        v-if="location"
        class="fixed inset-0 z-[1004] flex items-center justify-center p-4"
        @click.self="emit('close')"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 class="text-lg font-semibold text-gray-900">{{ t('location.shareModal.title') }}</h2>
            <button
              @click="emit('close')"
              class="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              :aria-label="t('common.close')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="px-5 py-5 space-y-5">
            <!-- Native Share Button (mobile) -->
            <button
              v-if="canNativeShare"
              @click="nativeShare"
              class="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors cursor-pointer"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {{ t('location.shareModal.nativeShare') }}
            </button>

            <!-- Social Media Grid -->
            <div>
              <p class="text-sm text-gray-500 mb-3">{{ t('location.shareModal.shareOn') }}</p>
              <div class="grid grid-cols-3 gap-3">
                <!-- WhatsApp -->
                <a
                  :href="whatsappUrl"
                  target="_blank"
                  rel="noopener"
                  class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  @click="emit('close')"
                >
                  <div class="w-12 h-12 flex items-center justify-center rounded-full bg-[#25D366]">
                    <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <span class="text-xs text-gray-600">WhatsApp</span>
                </a>

                <!-- Facebook -->
                <a
                  :href="facebookUrl"
                  target="_blank"
                  rel="noopener"
                  class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  @click="emit('close')"
                >
                  <div class="w-12 h-12 flex items-center justify-center rounded-full bg-[#1877F2]">
                    <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <span class="text-xs text-gray-600">Facebook</span>
                </a>

                <!-- Twitter/X -->
                <a
                  :href="twitterUrl"
                  target="_blank"
                  rel="noopener"
                  class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  @click="emit('close')"
                >
                  <div class="w-12 h-12 flex items-center justify-center rounded-full bg-black">
                    <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span class="text-xs text-gray-600">X</span>
                </a>

                <!-- Instagram -->
                <button
                  @click="shareViaInstagram"
                  class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div class="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]">
                    <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <span class="text-xs text-gray-600">Instagram</span>
                </button>

                <!-- Email -->
                <a
                  :href="emailUrl"
                  class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  @click="emit('close')"
                >
                  <div class="w-12 h-12 flex items-center justify-center rounded-full bg-gray-600">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span class="text-xs text-gray-600">Email</span>
                </a>

                <!-- More (native share / copy) -->
                <button
                  @click="shareMore"
                  class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div class="w-12 h-12 flex items-center justify-center rounded-full bg-gray-500">
                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="5" cy="12" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <circle cx="19" cy="12" r="2"/>
                    </svg>
                  </div>
                  <span class="text-xs text-gray-600">{{ t('location.shareModal.more') }}</span>
                </button>
              </div>
            </div>

            <!-- Copy Link -->
            <div>
              <p class="text-sm text-gray-500 mb-2">{{ t('location.shareModal.copyLink') }}</p>
              <div class="flex gap-2">
                <input
                  type="text"
                  :value="shareUrl"
                  readonly
                  class="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 truncate"
                />
                <button
                  @click="copyLink"
                  class="px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                  :class="copied ? 'bg-green-100 text-green-700' : 'bg-green-600 text-white hover:bg-green-700'"
                >
                  {{ copied ? t('location.shareModal.copied') : t('location.shareModal.copy') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row']

interface Props {
  location: Location | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const toast = useToast()
const copied = ref(false)

// Check if native share is available
const canNativeShare = computed(() => {
  return typeof navigator !== 'undefined' && !!navigator.share
})

// Share URL
const shareUrl = computed(() => {
  if (!props.location) return ''
  return `${window.location.origin}/location/${props.location.slug}`
})

// Share text with app branding
const shareText = computed(() => {
  if (!props.location) return ''
  return `${props.location.name} - ${props.location.address}, ${props.location.city} | Zero Waste Frankfurt`
})

// Social media URLs
const whatsappUrl = computed(() => {
  const text = encodeURIComponent(`${shareText.value}\n${shareUrl.value}`)
  return `https://wa.me/?text=${text}`
})

const facebookUrl = computed(() => {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl.value)}`
})

const twitterUrl = computed(() => {
  const text = encodeURIComponent(shareText.value)
  const url = encodeURIComponent(shareUrl.value)
  return `https://twitter.com/intent/tweet?text=${text}&url=${url}`
})

// More: opens native share or copies link as fallback
async function shareMore() {
  if (!props.location) return

  if (navigator.share) {
    try {
      await navigator.share({
        title: props.location.name,
        text: shareText.value,
        url: shareUrl.value
      })
      emit('close')
    } catch {
      // User cancelled
    }
  } else {
    // Desktop fallback: copy link
    await copyLink()
  }
}

// Instagram: uses native share (shows Instagram if installed) or copies link
async function shareViaInstagram() {
  if (!props.location) return

  if (navigator.share) {
    try {
      await navigator.share({
        title: props.location.name,
        text: shareText.value,
        url: shareUrl.value
      })
      emit('close')
    } catch {
      // User cancelled
    }
  } else {
    // Desktop fallback: copy link
    await copyLink()
  }
}

const emailUrl = computed(() => {
  if (!props.location) return ''
  const subject = encodeURIComponent(props.location.name)
  const body = encodeURIComponent(`${shareText.value}\n\n${shareUrl.value}`)
  return `mailto:?subject=${subject}&body=${body}`
})

// Native share
async function nativeShare() {
  if (!props.location) return

  try {
    await navigator.share({
      title: props.location.name,
      text: shareText.value,
      url: shareUrl.value
    })
    emit('close')
  } catch {
    // User cancelled - do nothing
  }
}

// Copy link
async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    toast.success(t('location.linkCopied'), 3000)
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = shareUrl.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    toast.success(t('location.linkCopied'), 3000)
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

// ESC key to close
function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.location) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
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
