<template>
  <div v-if="hasContactInfo" class="contact-info" :class="{ compact: size === 'compact' }">
    <!-- Website -->
    <a
      v-if="website"
      :href="website"
      target="_blank"
      rel="noopener"
      class="contact-item"
      :class="{ interactive: !disableInteraction }"
    >
      <span v-if="iconStyle === 'emoji'" class="contact-icon">🌐</span>
      <svg v-else class="contact-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
      <span class="contact-text" :class="textClass">
        {{ formatUrl(website) }}
      </span>
    </a>

    <!-- Phone -->
    <a
      v-if="phone"
      :href="`tel:${phone}`"
      class="contact-item"
      :class="{ interactive: !disableInteraction }"
    >
      <span v-if="iconStyle === 'emoji'" class="contact-icon">📞</span>
      <svg v-else class="contact-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
      <span class="contact-text" :class="textClass">
        {{ phone }}
      </span>
    </a>

    <!-- Email -->
    <a
      v-if="email"
      :href="`mailto:${email}`"
      class="contact-item"
      :class="{ interactive: !disableInteraction }"
    >
      <span v-if="iconStyle === 'emoji'" class="contact-icon">✉️</span>
      <svg v-else class="contact-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <span class="contact-text" :class="textClass">
        {{ email }}
      </span>
    </a>

    <!-- Instagram -->
    <a
      v-if="instagram"
      :href="`https://instagram.com/${instagram.replace('@', '')}`"
      target="_blank"
      rel="noopener"
      class="contact-item"
      :class="{ interactive: !disableInteraction }"
    >
      <span v-if="iconStyle === 'emoji'" class="contact-icon">📸</span>
      <svg v-else class="contact-icon-svg" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
      <span class="contact-text" :class="textClass">
        {{ instagram }}
      </span>
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  phone?: string | null
  website?: string | null
  email?: string | null
  instagram?: string | null
  size?: 'compact' | 'full'
  iconStyle?: 'emoji' | 'svg'
  disableInteraction?: boolean
  textClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'full',
  iconStyle: 'emoji',
  disableInteraction: false,
  textClass: ''
})

const hasContactInfo = computed(() => {
  return !!(props.website || props.phone || props.email || props.instagram)
})

function formatUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}
</script>

<style scoped>
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.contact-info.compact {
  gap: 0.5rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.2s;
}

.contact-item.interactive {
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  cursor: pointer;
}

.contact-item.interactive:hover {
  background: #f3f4f6;
}

.compact .contact-item.interactive {
  padding: 0.5rem;
}

.contact-icon {
  font-size: 1.125rem;
  flex-shrink: 0;
}

.compact .contact-icon {
  font-size: 1rem;
}

.contact-icon-svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: #9ca3af;
}

.compact .contact-icon-svg {
  width: 0.875rem;
  height: 0.875rem;
}

.contact-text {
  font-size: 0.875rem;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-item[href^="http"] .contact-text,
.contact-item[href^="mailto"] .contact-text {
  color: #2563eb;
}

.contact-item.interactive:hover .contact-text {
  text-decoration: underline;
}

.compact .contact-text {
  font-size: 0.8125rem;
}
</style>
