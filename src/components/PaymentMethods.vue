<template>
  <div v-if="hasPaymentMethods" class="payment-methods" :class="{ compact: size === 'small' }">
    <div v-if="showLabel && !compact" class="payment-label">
      {{ label }}
    </div>
    <div class="payment-icons" :class="{ horizontal: layout === 'horizontal' }">
      <span
        v-for="method in enabledMethods"
        :key="method.key"
        class="payment-icon"
        :title="method.label"
        :aria-label="method.label"
      >
        {{ method.icon }}
        <span v-if="!compact" class="payment-text">{{ method.label }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PaymentMethods } from '@/types/osm'
import { PAYMENT_METHOD_LABELS_DE, PAYMENT_METHOD_ICONS } from '@/types/osm'

interface Props {
  paymentMethods?: PaymentMethods | null
  size?: 'small' | 'medium' | 'large'
  layout?: 'horizontal' | 'vertical'
  showLabel?: boolean
  label?: string
  lang?: 'de' | 'en'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  layout: 'horizontal',
  showLabel: true,
  label: 'Zahlungsmethoden',
  lang: 'de'
})

const compact = computed(() => props.size === 'small')

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
</script>

<style scoped>
.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.payment-methods.compact {
  gap: 0.25rem;
}

.payment-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary, #6b7280);
  margin-bottom: 0.25rem;
}

.payment-icons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.payment-icons.horizontal {
  flex-direction: row;
  align-items: center;
}

.payment-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-background-soft, #f3f4f6);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: background-color 0.2s;
}

.payment-icon:hover {
  background: var(--color-background-mute, #e5e7eb);
}

.compact .payment-icon {
  padding: 0.125rem 0.25rem;
  font-size: 0.75rem;
  gap: 0.25rem;
}

.payment-text {
  color: var(--color-text, #1f2937);
  font-weight: 500;
}

.compact .payment-text {
  font-size: 0.75rem;
}

/* Small size: icon only */
.payment-methods.compact .payment-text {
  display: none;
}
</style>
