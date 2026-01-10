<template>
  <div v-if="show" class="field-badge-container">
    <div class="field-badge" :class="{ [variant]: true }">
      <span class="badge-icon" aria-hidden="true">{{ icon }}</span>
      <span class="badge-text">{{ text }}</span>
      <button
        v-if="clearable"
        type="button"
        class="badge-clear"
        :aria-label="clearLabel"
        @click="$emit('clear')"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  show: boolean
  source?: 'osm' | 'website'
  clearable?: boolean
  variant?: 'info' | 'success' | 'warning'
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  source: 'osm',
  clearable: true,
  variant: 'info'
})

defineEmits<{
  clear: []
}>()

const { t } = useI18n()

const text = computed(() => {
  if (props.source === 'osm') {
    return t('submit.autoFilledFrom')
  }
  return t('submit.autoFilledFromWebsite')
})

const icon = computed(() => {
  return props.source === 'osm' ? '🗺️' : '🌐'
})

const clearLabel = computed(() => {
  return t('submit.clearAutoFilled')
})
</script>

<style scoped>
.field-badge-container {
  margin-top: 6px;
}

.field-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: all 150ms;
}

.field-badge.info {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.field-badge.success {
  background: #d1fae5;
  color: #047857;
  border: 1px solid #6ee7b7;
}

.field-badge.warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.badge-icon {
  font-size: 14px;
  line-height: 1;
}

.badge-text {
  line-height: 1;
}

.badge-clear {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  margin-left: 4px;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  transition: opacity 150ms;
}

.badge-clear:hover {
  opacity: 1;
}

.badge-clear:focus {
  outline: 2px solid currentColor;
  outline-offset: 2px;
  border-radius: 2px;
}
</style>
