import { computed, type Ref } from 'vue'
import type { StructuredOpeningHours, OpeningHoursEntry } from '@/types/osm'

export function useOpeningHours(hours: Ref<StructuredOpeningHours | null>) {
  const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

  // Get current day name
  const today = computed(() => {
    const dayIndex = new Date().getDay() // 0 = Sunday
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[dayIndex]
  })

  // Get today's hours entry
  const todayHours = computed((): OpeningHoursEntry | null => {
    if (!hours.value?.entries) return null
    return hours.value.entries.find(e => e.day === today.value) || null
  })

  // Format hours for display (e.g., "11:30–22:00" or "Closed")
  const formatHours = (entry: OpeningHoursEntry | null): string => {
    if (!entry || entry.opens === null) return 'Closed'
    return `${entry.opens}–${entry.closes}`
  }

  // Get week starting from today
  const weekFromToday = computed((): OpeningHoursEntry[] => {
    if (!hours.value?.entries) return []

    const todayIndex = DAYS_ORDER.indexOf(today.value as typeof DAYS_ORDER[number])
    const reordered: OpeningHoursEntry[] = []

    for (let i = 0; i < 7; i++) {
      const dayIndex = (todayIndex + i) % 7
      const day = DAYS_ORDER[dayIndex]
      const entry = hours.value.entries.find(e => e.day === day)
      reordered.push(entry || { day, opens: null, closes: null })
    }

    return reordered
  })

  // Get week starting from Monday (standard order)
  const weekFromMonday = computed((): OpeningHoursEntry[] => {
    if (!hours.value?.entries) return []

    return DAYS_ORDER.map(day => {
      const entry = hours.value!.entries!.find(e => e.day === day)
      return entry || { day, opens: null, closes: null }
    })
  })

  // Localized day names
  const getDayName = (day: string, locale: 'de' | 'en' = 'de'): string => {
    const names = {
      de: {
        monday: 'Montag',
        tuesday: 'Dienstag',
        wednesday: 'Mittwoch',
        thursday: 'Donnerstag',
        friday: 'Freitag',
        saturday: 'Samstag',
        sunday: 'Sonntag'
      },
      en: {
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        sunday: 'Sunday'
      }
    }
    return names[locale][day as keyof typeof names['de']] || day
  }

  // Check if it's a special schedule
  const isSpecial = computed(() => hours.value?.special)

  return {
    today,
    todayHours,
    formatHours,
    weekFromToday,
    weekFromMonday,
    getDayName,
    isSpecial
  }
}
