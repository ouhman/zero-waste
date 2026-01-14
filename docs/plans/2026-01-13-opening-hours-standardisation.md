# Opening Hours Display & Suggestions

**Status:** Ready for execution
**Created:** 2026-01-13
**Phases:** 4 (each fits in ~150k token context)

## Overview

Improve opening hours display with a Google Maps-style expandable component and allow users to suggest corrections.

### Features

1. **Expandable Display** - Collapsed shows today's hours, expanded shows full week
2. **Accuracy Disclaimer** - Inform users that hours may be inaccurate
3. **Suggest Edit** - Day-by-day form for users to submit corrections
4. **Admin Review** - New page to review and approve/reject suggestions

### Out of Scope (Future)

- "Open now" real-time status indicator
- "Mark as temporarily/permanently closed"
- "Closes in X hours" countdown

---

## Phase 1: Database Schema & Types

**Goal:** Create the `hours_suggestions` table and TypeScript types.

### 1.1 Create Migration

Create `supabase/migrations/[timestamp]_hours_suggestions.sql`:

```sql
-- Hours suggestions table for user-submitted corrections
CREATE TABLE hours_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,

  -- Suggested hours (structured format, same as locations.opening_hours_structured)
  suggested_hours JSONB NOT NULL,

  -- Optional note from suggester
  note TEXT,

  -- Rate limiting: store IP hash (not raw IP for privacy)
  ip_hash TEXT NOT NULL,

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  admin_note TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_hours_suggestions_location ON hours_suggestions(location_id);
CREATE INDEX idx_hours_suggestions_status ON hours_suggestions(status);
CREATE INDEX idx_hours_suggestions_created ON hours_suggestions(created_at DESC);

-- Rate limiting index: find recent submissions from same IP
CREATE INDEX idx_hours_suggestions_ip_rate ON hours_suggestions(ip_hash, created_at DESC);

-- RLS Policies
ALTER TABLE hours_suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (rate limited at application level)
CREATE POLICY "Anyone can submit hours suggestions"
  ON hours_suggestions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view all suggestions
CREATE POLICY "Admins can view all suggestions"
  ON hours_suggestions FOR SELECT
  TO authenticated
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Only admins can update (approve/reject)
CREATE POLICY "Admins can update suggestions"
  ON hours_suggestions FOR UPDATE
  TO authenticated
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Trigger for updated_at
CREATE TRIGGER update_hours_suggestions_updated_at
  BEFORE UPDATE ON hours_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE hours_suggestions IS 'User-submitted corrections to location opening hours';
```

### 1.2 Update TypeScript Types

Add to `src/types/database.ts` (or create `src/types/hours.ts`):

```typescript
export interface HoursSuggestion {
  id: string
  location_id: string
  suggested_hours: StructuredOpeningHours
  note: string | null
  ip_hash: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_at: string | null
  reviewed_by: string | null
  admin_note: string | null
  created_at: string
  updated_at: string
}

export interface HoursSuggestionInsert {
  location_id: string
  suggested_hours: StructuredOpeningHours
  note?: string
  ip_hash: string
}

// Extended type with location info for admin list
export interface HoursSuggestionWithLocation extends HoursSuggestion {
  location: {
    id: string
    name: string
    slug: string
  }
}
```

### 1.3 Update StructuredOpeningHours Type

Ensure `src/types/osm.ts` includes closed days:

```typescript
export interface OpeningHoursEntry {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  opens: string | null  // null = closed
  closes: string | null // null = closed
}

export interface StructuredOpeningHours {
  entries: OpeningHoursEntry[]
  special?: '24/7' | 'by_appointment' | null
}
```

### 1.4 Fix Structured Hours Parser

Update `src/composables/useNominatim.ts` to include closed days in structured output:

```typescript
// In parseStructuredHours(), ensure closed days are included:
// Currently skips "off" days - change to include them with null times
```

### 1.5 Tests

Create `tests/unit/types/hours.test.ts`:
- Type validation tests
- Ensure StructuredOpeningHours handles all 7 days

### Phase 1 Deliverables

- [ ] Migration file created and applied
- [ ] TypeScript types added
- [ ] StructuredOpeningHours updated to include closed days
- [ ] Parser fixed to include closed days
- [ ] Types tested

---

## Phase 2: Display Component

**Goal:** Create the expandable opening hours display with disclaimer.

### 2.1 Create useOpeningHours Composable

Create `src/composables/useOpeningHours.ts`:

```typescript
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

  // Localized day names
  const getDayName = (day: string, locale: 'de' | 'en' = 'de'): string => {
    const names = {
      de: { monday: 'Montag', tuesday: 'Dienstag', wednesday: 'Mittwoch', thursday: 'Donnerstag', friday: 'Freitag', saturday: 'Samstag', sunday: 'Sonntag' },
      en: { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' }
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
    getDayName,
    isSpecial
  }
}
```

### 2.2 Create OpeningHoursDisplay Component

Create `src/components/common/OpeningHoursDisplay.vue`:

```vue
<template>
  <div class="opening-hours">
    <!-- Special cases: 24/7 or by appointment -->
    <div v-if="isSpecial" class="flex items-center gap-2 text-gray-600">
      <ClockIcon class="w-5 h-5" />
      <span>{{ specialText }}</span>
    </div>

    <!-- Normal hours display -->
    <div v-else-if="hasHours">
      <!-- Collapsed: Today's hours -->
      <button
        @click="expanded = !expanded"
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 w-full text-left cursor-pointer"
        :aria-expanded="expanded"
      >
        <ClockIcon class="w-5 h-5 flex-shrink-0" />
        <span class="flex-1">
          <span class="font-medium">{{ todayName }}:</span>
          {{ todayFormatted }}
        </span>
        <ChevronDownIcon
          class="w-4 h-4 transition-transform"
          :class="{ 'rotate-180': expanded }"
        />
      </button>

      <!-- Expanded: Full week -->
      <div v-if="expanded" class="mt-3 ml-7 space-y-1">
        <div
          v-for="(entry, index) in weekFromToday"
          :key="entry.day"
          class="flex justify-between text-sm py-1"
          :class="{ 'font-medium text-gray-900': index === 0, 'text-gray-600': index !== 0 }"
        >
          <span>{{ getDayName(entry.day, locale) }}</span>
          <span>{{ formatHours(entry) }}</span>
        </div>

        <!-- Disclaimer -->
        <p class="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
          {{ t('openingHours.disclaimer') }}
        </p>

        <!-- Suggest edit link -->
        <button
          @click="$emit('suggest-edit')"
          class="text-sm text-emerald-600 hover:text-emerald-700 hover:underline mt-2 cursor-pointer"
        >
          {{ t('openingHours.suggestEdit') }}
        </button>
      </div>
    </div>

    <!-- No hours available -->
    <div v-else class="flex items-center gap-2 text-gray-400">
      <ClockIcon class="w-5 h-5" />
      <span>{{ t('openingHours.notAvailable') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ClockIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useOpeningHours } from '@/composables/useOpeningHours'
import type { StructuredOpeningHours } from '@/types/osm'

const props = defineProps<{
  hours: StructuredOpeningHours | null
}>()

defineEmits<{
  'suggest-edit': []
}>()

const { t, locale } = useI18n()
const expanded = ref(false)

const hoursRef = computed(() => props.hours)
const {
  today,
  todayHours,
  formatHours,
  weekFromToday,
  getDayName,
  isSpecial
} = useOpeningHours(hoursRef)

const hasHours = computed(() => props.hours?.entries?.length > 0)

const todayName = computed(() => getDayName(today.value, locale.value as 'de' | 'en'))
const todayFormatted = computed(() => formatHours(todayHours.value))

const specialText = computed(() => {
  if (props.hours?.special === '24/7') return t('openingHours.24_7')
  if (props.hours?.special === 'by_appointment') return t('openingHours.byAppointment')
  return ''
})
</script>
```

### 2.3 Add i18n Translations

Add to `src/i18n/locales/de.json`:

```json
{
  "openingHours": {
    "notAvailable": "Öffnungszeiten nicht verfügbar",
    "disclaimer": "Angaben ohne Gewähr. Bitte überprüfen Sie die Zeiten vor Ihrem Besuch.",
    "suggestEdit": "Änderung vorschlagen",
    "24_7": "24 Stunden geöffnet",
    "byAppointment": "Nach Vereinbarung",
    "closed": "Geschlossen"
  }
}
```

Add to `src/i18n/locales/en.json`:

```json
{
  "openingHours": {
    "notAvailable": "Opening hours not available",
    "disclaimer": "Hours may be inaccurate. Please verify before visiting.",
    "suggestEdit": "Suggest an edit",
    "24_7": "Open 24 hours",
    "byAppointment": "By appointment",
    "closed": "Closed"
  }
}
```

### 2.4 Integrate into LocationDetailPanel

Update `src/components/LocationDetailPanel.vue`:

Replace the current opening hours section with:

```vue
<OpeningHoursDisplay
  :hours="location.opening_hours_structured"
  @suggest-edit="openSuggestionModal"
/>
```

### 2.5 Tests

Create `tests/component/common/OpeningHoursDisplay.spec.ts`:

- Renders today's hours in collapsed state
- Expands to show full week on click
- Highlights today in expanded view
- Shows disclaimer text
- Emits 'suggest-edit' event
- Handles null/empty hours gracefully
- Shows special cases (24/7, by appointment)
- i18n works for DE and EN

Create `tests/unit/composables/useOpeningHours.test.ts`:

- Returns correct today value
- Formats hours correctly
- Handles closed days
- Reorders week starting from today
- Returns localized day names

### Phase 2 Deliverables

- [ ] useOpeningHours composable created
- [ ] OpeningHoursDisplay component created
- [ ] i18n translations added
- [ ] Integrated into LocationDetailPanel
- [ ] Component tests passing
- [ ] Composable unit tests passing

---

## Phase 3: Suggestion Modal & Submission

**Goal:** Create the day-by-day hours editing form and submission flow.

### 3.1 Create useHoursSuggestion Composable

Create `src/composables/useHoursSuggestion.ts`:

```typescript
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { StructuredOpeningHours, HoursSuggestionInsert } from '@/types'

// Simple hash function for rate limiting (not cryptographic, just for grouping)
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + 'salt-for-hours-suggestions')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

export function useHoursSuggestion() {
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)
  const rateLimitExceeded = ref(false)

  // Rate limit: max 5 suggestions per IP per hour
  const RATE_LIMIT = 5
  const RATE_WINDOW_HOURS = 1

  const checkRateLimit = async (ipHash: string): Promise<boolean> => {
    const windowStart = new Date()
    windowStart.setHours(windowStart.getHours() - RATE_WINDOW_HOURS)

    const { count } = await supabase
      .from('hours_suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', windowStart.toISOString())

    return (count || 0) < RATE_LIMIT
  }

  const submitSuggestion = async (
    locationId: string,
    suggestedHours: StructuredOpeningHours,
    note?: string
  ): Promise<{ success: boolean; error?: string }> => {
    isSubmitting.value = true
    error.value = null
    rateLimitExceeded.value = false

    try {
      // Get client IP (via edge function or fallback)
      const ipResponse = await fetch('/api/client-ip')
      const ip = ipResponse.ok ? await ipResponse.text() : 'unknown'
      const ipHash = await hashIP(ip)

      // Check rate limit
      const withinLimit = await checkRateLimit(ipHash)
      if (!withinLimit) {
        rateLimitExceeded.value = true
        error.value = 'Too many suggestions. Please try again later.'
        return { success: false, error: error.value }
      }

      // Submit suggestion
      const { error: insertError } = await supabase
        .from('hours_suggestions')
        .insert({
          location_id: locationId,
          suggested_hours: suggestedHours,
          note: note || null,
          ip_hash: ipHash
        })

      if (insertError) {
        error.value = insertError.message
        return { success: false, error: error.value }
      }

      return { success: true }
    } catch (e) {
      error.value = 'Failed to submit suggestion'
      return { success: false, error: error.value }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    error,
    rateLimitExceeded,
    submitSuggestion
  }
}
```

### 3.2 Create HoursSuggestionModal Component

Create `src/components/common/HoursSuggestionModal.vue`:

```vue
<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="$emit('close')">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">{{ t('hoursSuggestion.title') }}</h2>
            <p class="text-sm text-gray-500">{{ locationName }}</p>
          </div>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 cursor-pointer">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="px-6 py-4 overflow-y-auto max-h-[60vh]">
        <!-- Day-by-day inputs -->
        <div class="space-y-3">
          <div v-for="day in DAYS" :key="day" class="flex items-center gap-3">
            <span class="w-24 text-sm font-medium text-gray-700">{{ getDayName(day) }}</span>

            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                :checked="hours[day].closed"
                @change="toggleClosed(day)"
                class="rounded border-gray-300"
              />
              <span class="text-sm text-gray-600">{{ t('hoursSuggestion.closed') }}</span>
            </label>

            <template v-if="!hours[day].closed">
              <input
                type="time"
                v-model="hours[day].opens"
                class="border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <span class="text-gray-400">–</span>
              <input
                type="time"
                v-model="hours[day].closes"
                class="border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </template>
          </div>
        </div>

        <!-- Note field -->
        <div class="mt-6">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ t('hoursSuggestion.noteLabel') }}
            <span class="text-gray-400 font-normal">({{ t('hoursSuggestion.optional') }})</span>
          </label>
          <textarea
            v-model="note"
            rows="2"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            :placeholder="t('hoursSuggestion.notePlaceholder')"
          />
        </div>

        <!-- Rate limit warning -->
        <p v-if="rateLimitExceeded" class="mt-4 text-sm text-red-600">
          {{ t('hoursSuggestion.rateLimitError') }}
        </p>

        <!-- Error -->
        <p v-if="error && !rateLimitExceeded" class="mt-4 text-sm text-red-600">
          {{ error }}
        </p>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 cursor-pointer"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          @click="submit"
          :disabled="isSubmitting"
          class="px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
        >
          {{ isSubmitting ? t('common.submitting') : t('hoursSuggestion.submit') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useHoursSuggestion } from '@/composables/useHoursSuggestion'
import type { StructuredOpeningHours } from '@/types/osm'

const props = defineProps<{
  locationId: string
  locationName: string
  currentHours: StructuredOpeningHours | null
}>()

const emit = defineEmits<{
  close: []
  submitted: []
}>()

const { t, locale } = useI18n()
const { submitSuggestion, isSubmitting, error, rateLimitExceeded } = useHoursSuggestion()

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

type DayHours = { opens: string; closes: string; closed: boolean }
const hours = reactive<Record<string, DayHours>>({})
const note = ref('')

// Initialize from current hours
onMounted(() => {
  for (const day of DAYS) {
    const entry = props.currentHours?.entries?.find(e => e.day === day)
    hours[day] = {
      opens: entry?.opens || '09:00',
      closes: entry?.closes || '18:00',
      closed: entry?.opens === null
    }
  }
})

const toggleClosed = (day: string) => {
  hours[day].closed = !hours[day].closed
}

const getDayName = (day: string): string => {
  const names = {
    de: { monday: 'Montag', tuesday: 'Dienstag', wednesday: 'Mittwoch', thursday: 'Donnerstag', friday: 'Freitag', saturday: 'Samstag', sunday: 'Sonntag' },
    en: { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' }
  }
  const loc = locale.value as 'de' | 'en'
  return names[loc]?.[day as keyof typeof names['de']] || day
}

const submit = async () => {
  const suggestedHours: StructuredOpeningHours = {
    entries: DAYS.map(day => ({
      day,
      opens: hours[day].closed ? null : hours[day].opens,
      closes: hours[day].closed ? null : hours[day].closes
    }))
  }

  const result = await submitSuggestion(props.locationId, suggestedHours, note.value)

  if (result.success) {
    emit('submitted')
    emit('close')
  }
}
</script>
```

### 3.3 Create IP Endpoint (Edge Function)

Create `supabase/functions/client-ip/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve((req) => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'

  return new Response(ip, {
    headers: { 'Content-Type': 'text/plain' }
  })
})
```

### 3.4 Add i18n Translations

Add to locale files:

```json
{
  "hoursSuggestion": {
    "title": "Öffnungszeiten vorschlagen",
    "closed": "Geschlossen",
    "noteLabel": "Anmerkung",
    "optional": "optional",
    "notePlaceholder": "z.B. Ich war heute dort und die Zeiten stimmen nicht...",
    "submit": "Vorschlag senden",
    "rateLimitError": "Zu viele Vorschläge. Bitte versuchen Sie es später erneut.",
    "successMessage": "Vielen Dank! Ihr Vorschlag wird geprüft."
  }
}
```

### 3.5 Integrate Modal into LocationDetailPanel

Update `src/components/LocationDetailPanel.vue`:

```vue
<script setup>
import { ref } from 'vue'
import HoursSuggestionModal from '@/components/common/HoursSuggestionModal.vue'

const showSuggestionModal = ref(false)

const openSuggestionModal = () => {
  showSuggestionModal.value = true
}

const onSuggestionSubmitted = () => {
  // Show success toast
  toast.success(t('hoursSuggestion.successMessage'))
}
</script>

<template>
  <!-- ... existing content ... -->

  <OpeningHoursDisplay
    :hours="location.opening_hours_structured"
    @suggest-edit="openSuggestionModal"
  />

  <!-- Modal -->
  <HoursSuggestionModal
    v-if="showSuggestionModal"
    :location-id="location.id"
    :location-name="location.name"
    :current-hours="location.opening_hours_structured"
    @close="showSuggestionModal = false"
    @submitted="onSuggestionSubmitted"
  />
</template>
```

### 3.6 Tests

Create `tests/component/common/HoursSuggestionModal.spec.ts`:

- Renders all 7 days
- Pre-fills current hours
- Toggles closed state
- Validates time inputs
- Submits correct data structure
- Shows rate limit error
- Closes on success
- Emits events correctly

Create `tests/unit/composables/useHoursSuggestion.test.ts`:

- Submits suggestion to Supabase
- Handles rate limiting
- Returns correct error states

### Phase 3 Deliverables

- [ ] useHoursSuggestion composable created
- [ ] HoursSuggestionModal component created
- [ ] client-ip edge function deployed
- [ ] i18n translations added
- [ ] Integrated into LocationDetailPanel
- [ ] Component tests passing
- [ ] Unit tests passing

---

## Phase 4: Admin Review Interface

**Goal:** Create admin page for reviewing suggestions with dashboard counter.

### 4.1 Create Admin Store Methods

Add to `src/stores/admin.ts`:

```typescript
// Hours suggestions state
const hoursSuggestions = ref<HoursSuggestionWithLocation[]>([])
const pendingSuggestionsCount = ref(0)

const fetchHoursSuggestions = async (status?: 'pending' | 'approved' | 'rejected') => {
  let query = supabase
    .from('hours_suggestions')
    .select(`
      *,
      location:locations(id, name, slug)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (!error && data) {
    hoursSuggestions.value = data
  }

  return { data, error }
}

const fetchPendingSuggestionsCount = async () => {
  const { count } = await supabase
    .from('hours_suggestions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  pendingSuggestionsCount.value = count || 0
}

const reviewSuggestion = async (
  id: string,
  status: 'approved' | 'rejected',
  adminNote?: string
) => {
  const { error } = await supabase
    .from('hours_suggestions')
    .update({
      status,
      admin_note: adminNote,
      reviewed_at: new Date().toISOString(),
      reviewed_by: (await supabase.auth.getUser()).data.user?.id
    })
    .eq('id', id)

  if (!error && status === 'approved') {
    // Also update the location's opening hours
    const suggestion = hoursSuggestions.value.find(s => s.id === id)
    if (suggestion) {
      await updateLocationHours(suggestion.location_id, suggestion.suggested_hours)
    }
  }

  return { error }
}

const updateLocationHours = async (locationId: string, hours: StructuredOpeningHours) => {
  // Update structured and regenerate OSM format
  const osmFormat = structuredToOsm(hours) // Helper function
  const textFormat = parseOsmOpeningHours(osmFormat).formatted

  return supabase
    .from('locations')
    .update({
      opening_hours_structured: hours,
      opening_hours_osm: osmFormat,
      opening_hours_text: textFormat
    })
    .eq('id', locationId)
}
```

### 4.2 Create HoursSuggestionsList Component

Create `src/components/admin/HoursSuggestionsList.vue`:

```vue
<template>
  <div class="space-y-4">
    <!-- Filter tabs -->
    <div class="flex gap-2 border-b border-gray-200">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="currentStatus = tab.value"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px cursor-pointer"
        :class="currentStatus === tab.value
          ? 'border-emerald-600 text-emerald-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'"
      >
        {{ tab.label }}
        <span v-if="tab.value === 'pending' && pendingCount > 0"
              class="ml-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
          {{ pendingCount }}
        </span>
      </button>
    </div>

    <!-- Suggestions list -->
    <div v-if="loading" class="text-center py-8">
      <LoadingSpinner />
    </div>

    <div v-else-if="suggestions.length === 0" class="text-center py-8 text-gray-500">
      {{ t('admin.noSuggestions') }}
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="suggestion in suggestions"
        :key="suggestion.id"
        class="bg-white rounded-lg border border-gray-200 p-4"
      >
        <!-- Header -->
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="font-medium text-gray-900">
              <router-link :to="`/admin/edit/${suggestion.location.id}`" class="hover:underline">
                {{ suggestion.location.name }}
              </router-link>
            </h3>
            <p class="text-sm text-gray-500">
              {{ formatDate(suggestion.created_at) }}
            </p>
          </div>
          <span
            class="px-2 py-1 text-xs rounded-full"
            :class="statusClasses[suggestion.status]"
          >
            {{ suggestion.status }}
          </span>
        </div>

        <!-- Hours comparison -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h4 class="text-sm font-medium text-gray-500 mb-2">Current</h4>
            <HoursTable :hours="currentHours[suggestion.location_id]" />
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500 mb-2">Suggested</h4>
            <HoursTable :hours="suggestion.suggested_hours" highlight />
          </div>
        </div>

        <!-- Note -->
        <div v-if="suggestion.note" class="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
          <strong>Note:</strong> {{ suggestion.note }}
        </div>

        <!-- Actions -->
        <div v-if="suggestion.status === 'pending'" class="flex justify-end gap-2">
          <button
            @click="reject(suggestion.id)"
            class="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded cursor-pointer"
          >
            Reject
          </button>
          <button
            @click="approve(suggestion.id)"
            class="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 4.3 Create Admin Route

Add to `src/router/index.ts`:

```typescript
{
  path: '/admin/hours-suggestions',
  name: 'AdminHoursSuggestions',
  component: () => import('@/views/admin/HoursSuggestionsView.vue'),
  meta: { requiresAuth: true, requiresAdmin: true }
}
```

### 4.4 Create View Component

Create `src/views/admin/HoursSuggestionsView.vue`:

```vue
<template>
  <AdminLayout>
    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">
        {{ t('admin.hoursSuggestions') }}
      </h1>
      <HoursSuggestionsList />
    </div>
  </AdminLayout>
</template>
```

### 4.5 Update Dashboard

Add to admin dashboard (`src/views/admin/AdminDashboard.vue`):

```vue
<!-- Add card for pending suggestions -->
<router-link to="/admin/hours-suggestions" class="block">
  <div class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-500">Pending Hours Suggestions</p>
        <p class="text-2xl font-bold text-gray-900">{{ pendingSuggestionsCount }}</p>
      </div>
      <ClockIcon class="w-8 h-8 text-emerald-600" />
    </div>
  </div>
</router-link>
```

### 4.6 Add Sidebar Link

Update `src/components/admin/AdminLayout.vue`:

```vue
<router-link
  to="/admin/hours-suggestions"
  class="flex items-center gap-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100"
  :class="{ 'bg-emerald-50 text-emerald-700': route.path === '/admin/hours-suggestions' }"
>
  <ClockIcon class="w-5 h-5" />
  <span>Hours Suggestions</span>
  <span v-if="pendingSuggestionsCount > 0" class="ml-auto px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
    {{ pendingSuggestionsCount }}
  </span>
</router-link>
```

### 4.7 Tests

Create `tests/component/admin/HoursSuggestionsList.spec.ts`:

- Renders pending suggestions
- Filters by status
- Shows hours comparison
- Approve/reject actions work
- Updates location on approve

Create `tests/e2e/admin-hours-suggestions.spec.ts`:

- Admin can view suggestions list
- Admin can approve suggestion
- Admin can reject suggestion
- Location hours update on approval

### Phase 4 Deliverables

- [ ] Admin store methods added
- [ ] HoursSuggestionsList component created
- [ ] HoursSuggestionsView created
- [ ] Route added and protected
- [ ] Dashboard card added
- [ ] Sidebar link added with badge
- [ ] Component tests passing
- [ ] E2E tests passing

---

## Implementation Notes

### Rate Limiting Strategy

- Hash IP address for privacy (don't store raw IPs)
- 5 suggestions per IP per hour
- Check count before insert
- Show user-friendly error message

### Data Sync on Approval

When admin approves a suggestion:
1. Update `opening_hours_structured` with suggested JSON
2. Regenerate `opening_hours_osm` from structured data
3. Regenerate `opening_hours_text` by parsing OSM format
4. All three fields stay in sync

### Helper Function: structuredToOsm()

Create utility to convert structured JSON back to OSM format:

```typescript
function structuredToOsm(hours: StructuredOpeningHours): string {
  // Group consecutive days with same hours
  // Output: "Mo-Fr 09:00-18:00; Sa 10:00-14:00; Su off"
}
```

---

## Testing Summary

| Phase | Unit Tests | Component Tests | E2E Tests |
|-------|------------|-----------------|-----------|
| 1 | Types validation | - | - |
| 2 | useOpeningHours | OpeningHoursDisplay | - |
| 3 | useHoursSuggestion | HoursSuggestionModal | - |
| 4 | Admin store | HoursSuggestionsList | Admin flow |

---

## Files Created/Modified

### New Files
- `supabase/migrations/[timestamp]_hours_suggestions.sql`
- `supabase/functions/client-ip/index.ts`
- `src/types/hours.ts`
- `src/composables/useOpeningHours.ts`
- `src/composables/useHoursSuggestion.ts`
- `src/components/common/OpeningHoursDisplay.vue`
- `src/components/common/HoursSuggestionModal.vue`
- `src/components/admin/HoursSuggestionsList.vue`
- `src/views/admin/HoursSuggestionsView.vue`
- `tests/unit/composables/useOpeningHours.test.ts`
- `tests/unit/composables/useHoursSuggestion.test.ts`
- `tests/component/common/OpeningHoursDisplay.spec.ts`
- `tests/component/common/HoursSuggestionModal.spec.ts`
- `tests/component/admin/HoursSuggestionsList.spec.ts`
- `tests/e2e/admin-hours-suggestions.spec.ts`

### Modified Files
- `src/types/osm.ts` (update StructuredOpeningHours)
- `src/types/database.ts` (add HoursSuggestion types)
- `src/composables/useNominatim.ts` (fix parser for closed days)
- `src/components/LocationDetailPanel.vue` (integrate new display)
- `src/stores/admin.ts` (add suggestions methods)
- `src/router/index.ts` (add admin route)
- `src/components/admin/AdminLayout.vue` (add sidebar link)
- `src/views/admin/AdminDashboard.vue` (add counter card)
- `src/i18n/locales/de.json` (add translations)
- `src/i18n/locales/en.json` (add translations)

---

## Execution

Run each phase with:
```bash
/execute-plan docs/plans/opening-hours-display.md
```

Or execute phases individually by specifying phase number.
