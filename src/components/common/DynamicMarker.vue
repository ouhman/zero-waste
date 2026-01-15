<template>
  <svg
    class="dynamic-marker"
    :viewBox="`0 0 ${size} ${size}`"
    :width="size"
    :height="size"
    role="img"
    aria-label="Location marker"
  >
    <!-- Circle background with border -->
    <circle
      :cx="size / 2"
      :cy="size / 2"
      :r="circleRadius"
      :fill="color"
      :stroke="borderColor"
      :stroke-width="borderWidth"
    />

    <!-- Iconify icon centered -->
    <g :transform="`translate(${iconOffset}, ${iconOffset})`" :style="{ color: iconColor }">
      <Icon
        :icon="iconName"
        :width="iconSize"
        :height="iconSize"
        :color="iconColor"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { MarkerSize } from '@/types/marker'
import { DEFAULT_MARKER_CONFIG } from '@/types/marker'

interface Props {
  /**
   * Iconify icon identifier (e.g., 'mdi:recycle', 'lucide:store')
   */
  iconName: string

  /**
   * Background color (hex format, e.g., '#10B981')
   */
  color: string

  /**
   * Marker size in pixels (default: 32)
   */
  size?: MarkerSize

  /**
   * Border width in pixels (default: 2)
   */
  borderWidth?: number

  /**
   * Border color (hex format, default: '#FFFFFF')
   */
  borderColor?: string

  /**
   * Icon color (hex format, default: '#FFFFFF' for white)
   */
  iconColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: DEFAULT_MARKER_CONFIG.size,
  borderWidth: DEFAULT_MARKER_CONFIG.borderWidth,
  borderColor: DEFAULT_MARKER_CONFIG.borderColor,
  iconColor: '#FFFFFF'
})

/**
 * Circle radius accounting for border width
 */
const circleRadius = computed(() => {
  return (props.size / 2) - props.borderWidth
})

/**
 * Icon size is 60% of marker size for good proportion
 */
const iconSize = computed(() => {
  return Math.floor(props.size * 0.6)
})

/**
 * Icon offset to center it in the marker
 */
const iconOffset = computed(() => {
  return Math.floor((props.size - iconSize.value) / 2)
})
</script>

<style scoped>
.dynamic-marker {
  display: block;
}
</style>
