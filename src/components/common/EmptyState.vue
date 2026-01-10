<template>
  <div class="empty-state">
    <div v-if="icon" class="empty-state-icon">
      <component :is="icon" />
    </div>
    <div v-else class="empty-state-icon-default">
      <svg
        class="w-16 h-16 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    </div>
    <h3 class="empty-state-title">{{ title }}</h3>
    <p v-if="description" class="empty-state-description">{{ description }}</p>
    <div v-if="$slots.action || actionText" class="empty-state-action">
      <slot name="action">
        <button
          v-if="actionText"
          type="button"
          class="btn-primary"
          @click="$emit('action')"
        >
          {{ actionText }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  title: string
  description?: string
  actionText?: string
  icon?: Component
}

defineProps<Props>()

defineEmits<{
  action: []
}>()
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.empty-state-icon,
.empty-state-icon-default {
  margin-bottom: 1rem;
}

.empty-state-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem;
}

.empty-state-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1.5rem;
  max-width: 32rem;
}

.empty-state-action {
  margin-top: 0.5rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  background-color: #3b82f6;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-primary:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}
</style>
