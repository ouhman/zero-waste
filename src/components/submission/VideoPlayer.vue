<template>
  <div class="video-player" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- Video Element -->
    <div class="video-wrapper" @click="togglePlay">
      <video
        ref="videoRef"
        :src="currentSource"
        :poster="poster"
        playsinline
        loop
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoadedMetadata"
        @play="isPlaying = true"
        @pause="isPlaying = false"
        @waiting="isBuffering = true"
        @canplay="isBuffering = false"
      />

      <!-- Play overlay (shown when paused) -->
      <div v-if="!isPlaying && !isBuffering" class="play-overlay">
        <button class="play-button" :aria-label="t('videoPlayer.play')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>

      <!-- Buffering indicator -->
      <div v-if="isBuffering" class="buffering-overlay">
        <div class="spinner" />
      </div>
    </div>

    <!-- Controls -->
    <div class="controls">
      <!-- Play/Pause -->
      <button
        class="control-btn"
        @click="togglePlay"
        :aria-label="isPlaying ? t('videoPlayer.pause') : t('videoPlayer.play')"
      >
        <svg v-if="isPlaying" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>

      <!-- Progress bar -->
      <div class="progress-container" @click="seek">
        <div class="progress-bar">
          <div class="progress-filled" :style="{ width: `${progress}%` }" />
          <div class="progress-handle" :style="{ left: `${progress}%` }" />
        </div>
      </div>

      <!-- Time display -->
      <span class="time-display">{{ formatTime(currentTime) }}</span>

      <!-- Quality selector -->
      <div class="quality-selector">
        <button
          class="quality-btn"
          @click="showQualityMenu = !showQualityMenu"
          :aria-label="t('videoPlayer.quality')"
          :aria-expanded="showQualityMenu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
          <span class="quality-label">{{ currentQualityLabel }}</span>
        </button>

        <!-- Quality menu -->
        <div v-if="showQualityMenu" class="quality-menu">
          <button
            v-for="q in qualities"
            :key="q.value"
            class="quality-option"
            :class="{ active: currentQuality === q.value }"
            @click="selectQuality(q.value)"
          >
            {{ q.label }}
          </button>
        </div>
      </div>

      <!-- Fullscreen -->
      <button
        class="control-btn"
        @click="toggleFullscreen"
        :aria-label="t('videoPlayer.fullscreen')"
      >
        <svg v-if="!isFullscreen" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  sources: {
    low: string
    medium: string
    high: string
  }
  poster?: string
  defaultQuality?: 'low' | 'medium' | 'high'
}

const props = withDefaults(defineProps<Props>(), {
  defaultQuality: 'medium'
})

const { t } = useI18n()

const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const isBuffering = ref(false)
const isFullscreen = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const showQualityMenu = ref(false)
const currentQuality = ref<'low' | 'medium' | 'high'>(props.defaultQuality)

const qualities = [
  { value: 'low' as const, label: '480p' },
  { value: 'medium' as const, label: '720p' },
  { value: 'high' as const, label: '1080p' }
]

const currentQualityLabel = computed(() => {
  return qualities.find(q => q.value === currentQuality.value)?.label || '720p'
})

const currentSource = computed(() => {
  return props.sources[currentQuality.value]
})

function togglePlay() {
  if (!videoRef.value) return

  if (isPlaying.value) {
    videoRef.value.pause()
  } else {
    videoRef.value.play()
  }
}

function onTimeUpdate() {
  if (!videoRef.value) return
  currentTime.value = videoRef.value.currentTime
  progress.value = (currentTime.value / duration.value) * 100
}

function onLoadedMetadata() {
  if (!videoRef.value) return
  duration.value = videoRef.value.duration
}

function seek(e: MouseEvent) {
  if (!videoRef.value) return

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  videoRef.value.currentTime = percent * duration.value
}

function selectQuality(quality: 'low' | 'medium' | 'high') {
  const wasPlaying = isPlaying.value
  const savedTime = currentTime.value

  currentQuality.value = quality
  showQualityMenu.value = false

  // Restore playback position after source change
  if (videoRef.value) {
    videoRef.value.addEventListener('loadedmetadata', () => {
      if (videoRef.value) {
        videoRef.value.currentTime = savedTime
        if (wasPlaying) {
          videoRef.value.play()
        }
      }
    }, { once: true })
  }
}

function toggleFullscreen() {
  const container = videoRef.value?.closest('.video-player') as HTMLElement
  if (!container) return

  if (!document.fullscreenElement) {
    container.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Close quality menu when clicking outside
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.quality-selector')) {
    showQualityMenu.value = false
  }
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<style scoped>
.video-player {
  position: relative;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  max-width: 100%;
}

.video-wrapper {
  position: relative;
  cursor: pointer;
  aspect-ratio: 16 / 9;
}

.video-wrapper video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
}

.play-button {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s, background 0.15s;
}

.play-button:hover {
  transform: scale(1.1);
  background: white;
}

.play-button svg {
  width: 32px;
  height: 32px;
  color: #111;
  margin-left: 4px;
}

.buffering-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

.control-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.15s;
  flex-shrink: 0;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.control-btn svg {
  width: 22px;
  height: 22px;
}

.progress-container {
  flex: 1;
  height: 36px;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 4px;
}

.progress-bar {
  position: relative;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.progress-filled {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #10b981;
  border-radius: 2px;
  transition: width 0.1s;
}

.progress-handle {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.15s;
}

.progress-container:hover .progress-handle {
  opacity: 1;
}

.time-display {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  text-align: center;
}

.quality-selector {
  position: relative;
}

.quality-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background 0.15s;
}

.quality-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.quality-btn svg {
  width: 16px;
  height: 16px;
}

.quality-label {
  display: none;
}

@media (min-width: 480px) {
  .quality-label {
    display: inline;
  }
}

.quality-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  background: rgba(28, 28, 28, 0.95);
  border-radius: 8px;
  padding: 6px 0;
  min-width: 100px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.quality-option {
  display: block;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: white;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s;
}

.quality-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.quality-option.active {
  color: #10b981;
  font-weight: 600;
}

/* Fullscreen adjustments */
.is-fullscreen {
  border-radius: 0;
}

.is-fullscreen .video-wrapper {
  aspect-ratio: auto;
  height: 100vh;
}

/* Mobile touch-friendly */
@media (max-width: 480px) {
  .controls {
    padding: 8px;
    gap: 6px;
  }

  .control-btn {
    width: 40px;
    height: 40px;
  }

  .play-button {
    width: 64px;
    height: 64px;
  }

  .play-button svg {
    width: 28px;
    height: 28px;
  }

  .progress-bar {
    height: 6px;
  }

  .progress-handle {
    width: 18px;
    height: 18px;
    opacity: 1;
  }
}
</style>
