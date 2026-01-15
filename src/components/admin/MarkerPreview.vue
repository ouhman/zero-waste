<template>
  <div class="marker-preview">
    <label class="preview-label">
      {{ $t?.('admin.categories.form.preview') || 'Preview' }}
    </label>
    <div class="preview-container">
      <DynamicMarker
        v-if="iconName"
        :icon-name="iconName"
        :color="color"
        :size="size"
      />
      <div v-else class="preview-placeholder">
        <span class="placeholder-text">
          {{ $t?.('admin.categories.form.selectIconFirst') || 'Select an icon to see preview' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DynamicMarker from '@/components/common/DynamicMarker.vue'
import type { MarkerSize } from '@/types/marker'

interface Props {
  iconName: string
  color: string
  size: MarkerSize
}

withDefaults(defineProps<Props>(), {
  color: '#10B981',
  size: 32
})
</script>

<style scoped>
.marker-preview {
  width: 100%;
}

.preview-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 4rem;
  padding: 1rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.375rem;
  background-color: #F9FAFB;
}

.preview-placeholder {
  text-align: center;
  padding: 1rem;
}

.placeholder-text {
  color: #9CA3AF;
  font-size: 0.875rem;
}
</style>
