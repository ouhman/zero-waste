<template>
  <div class="text-sm">
    <div v-if="!hours?.entries?.length" class="text-gray-400">
      No hours set
    </div>
    <div v-else class="space-y-1">
      <div
        v-for="entry in sortedEntries"
        :key="entry.day"
        class="flex justify-between"
        :class="{ 'bg-yellow-50 -mx-1 px-1 rounded': highlight && isChanged(entry) }"
      >
        <span class="text-gray-600">{{ getDayShort(entry.day) }}</span>
        <span :class="entry.opens === null ? 'text-gray-400' : ''">
          {{ formatEntry(entry) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StructuredOpeningHours, OpeningHoursEntry } from '@/types/osm'

const props = defineProps<{
  hours: StructuredOpeningHours | null
  highlight?: boolean
  compareWith?: StructuredOpeningHours | null
}>()

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const sortedEntries = computed(() => {
  if (!props.hours?.entries) return []
  return [...props.hours.entries].sort((a, b) =>
    DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day)
  )
})

const getDayShort = (day: string) => {
  const shorts: Record<string, string> = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
    thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
  }
  return shorts[day] || day
}

const formatEntry = (entry: OpeningHoursEntry) => {
  if (entry.opens === null) return 'Closed'
  return `${entry.opens}–${entry.closes}`
}

const isChanged = (entry: OpeningHoursEntry) => {
  if (!props.compareWith?.entries) return false
  const original = props.compareWith.entries.find(e => e.day === entry.day)
  if (!original) return true
  return original.opens !== entry.opens || original.closes !== entry.closes
}
</script>
