<template>
  <AdminLayout>
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">
          {{ t('admin.hoursSuggestions.title') }}
        </h1>
        <p class="mt-1 text-sm text-gray-600">
          {{ t('admin.hoursSuggestions.subtitle') }}
        </p>
      </div>
      <HoursSuggestionsList />
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import HoursSuggestionsList from '@/components/admin/HoursSuggestionsList.vue'

const { t } = useI18n()
</script>
