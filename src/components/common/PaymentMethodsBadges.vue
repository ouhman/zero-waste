<template>
  <div v-if="hasPaymentMethods" class="payment-badges" :class="{ inline: layout === 'inline' }">
    <span
      v-for="method in enabledMethods"
      :key="method.key"
      class="payment-badge"
      :class="sizeClass"
      :title="method.label"
    >
      <span class="badge-icon">{{ method.icon }}</span>
      <span v-if="showLabel" class="badge-label">{{ method.label }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PaymentMethods } from '@/types/osm'
import { PAYMENT_METHOD_LABELS_DE, PAYMENT_METHOD_ICONS } from '@/types/osm'

interface Props {
  paymentMethods?: PaymentMethods | null
  layout?: 'inline' | 'wrap'
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'wrap',
  size: 'medium',
  showLabel: true
})

const hasPaymentMethods = computed(() => {
  if (!props.paymentMethods) return false
  return Object.values(props.paymentMethods).some(value => value === true)
})

interface PaymentMethodDisplay {
  key: keyof PaymentMethods
  icon: string
  label: string
}

const enabledMethods = computed<PaymentMethodDisplay[]>(() => {
  if (!props.paymentMethods) return []

  const methods: PaymentMethodDisplay[] = []
  const labels = PAYMENT_METHOD_LABELS_DE

  // Priority order for display (most common first)
  const priorityOrder: (keyof PaymentMethods)[] = [
    'cash',
    'debit_cards',
    'credit_cards',
    'contactless',
    'mobile_payment',
    'visa',
    'mastercard',
    'maestro',
    'american_express'
  ]

  for (const key of priorityOrder) {
    if (props.paymentMethods[key]) {
      methods.push({
        key,
        icon: PAYMENT_METHOD_ICONS[key],
        label: labels[key]
      })
    }
  }

  return methods
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'small':
      return 'badge-small'
    case 'large':
      return 'badge-large'
    default:
      return 'badge-medium'
  }
})
</script>

<style scoped>
.payment-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  align-items: center;
}

.payment-badges.inline {
  flex-wrap: nowrap;
  overflow-x: auto;
}

.payment-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  border-radius: 0.375rem;
  color: #374151;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  transition: background-color 0.2s;
}

.payment-badge:hover {
  background: #e5e7eb;
}

/* Size variants */
.badge-small {
  padding: 0.125rem 0.375rem;
  font-size: 0.75rem;
  gap: 0.1875rem;
}

.badge-small .badge-icon {
  font-size: 0.75rem;
}

.badge-medium {
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
}

.badge-medium .badge-icon {
  font-size: 0.875rem;
}

.badge-large {
  padding: 0.375rem 0.625rem;
  font-size: 0.875rem;
}

.badge-large .badge-icon {
  font-size: 1rem;
}

.badge-icon {
  flex-shrink: 0;
}

.badge-label {
  flex-shrink: 0;
}
</style>
