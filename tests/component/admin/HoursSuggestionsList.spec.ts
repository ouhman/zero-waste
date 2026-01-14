import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import HoursSuggestionsList from '@/components/admin/HoursSuggestionsList.vue'
import { useAdminStore } from '@/stores/admin'
import type { HoursSuggestionWithLocation } from '@/types/hours'

// Mock router
const RouterLinkStub = {
  name: 'RouterLink',
  template: '<a><slot /></a>',
  props: ['to']
}

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    path: '/bulk-station/hours-suggestions'
  }))
}))

// Mock toast composable
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn()
  })
}))

const mockSuggestion: HoursSuggestionWithLocation = {
  id: 'test-id-1',
  location_id: 'loc-1',
  suggested_hours: {
    entries: [
      { day: 'monday', opens: '09:00', closes: '18:00' },
      { day: 'tuesday', opens: '09:00', closes: '18:00' },
      { day: 'wednesday', opens: '09:00', closes: '18:00' },
      { day: 'thursday', opens: '09:00', closes: '18:00' },
      { day: 'friday', opens: '09:00', closes: '18:00' },
      { day: 'saturday', opens: '10:00', closes: '14:00' },
      { day: 'sunday', opens: null, closes: null }
    ]
  },
  note: 'Hours have changed',
  ip_hash: 'hash123',
  status: 'pending',
  reviewed_at: null,
  reviewed_by: null,
  admin_note: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  location: {
    id: 'loc-1',
    name: 'Test Location',
    slug: 'test-location',
    opening_hours_structured: {
      entries: [
        { day: 'monday', opens: '10:00', closes: '17:00' },
        { day: 'tuesday', opens: '10:00', closes: '17:00' },
        { day: 'wednesday', opens: '10:00', closes: '17:00' },
        { day: 'thursday', opens: '10:00', closes: '17:00' },
        { day: 'friday', opens: '10:00', closes: '17:00' },
        { day: 'saturday', opens: null, closes: null },
        { day: 'sunday', opens: null, closes: null }
      ]
    }
  }
}

describe('HoursSuggestionsList', () => {
  let pinia: ReturnType<typeof createPinia>
  let i18n: ReturnType<typeof createI18n>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: {
        en: {
          admin: {
            hoursSuggestions: {
              tabs: {
                pending: 'Pending',
                approved: 'Approved',
                rejected: 'Rejected'
              },
              noSuggestions: 'No suggestions found',
              noPendingDescription: 'All suggestions have been reviewed',
              noApprovedDescription: 'No approved suggestions yet',
              noRejectedDescription: 'No rejected suggestions yet',
              currentHours: 'Current Hours',
              suggestedHours: 'Suggested Hours',
              userNote: 'User Note',
              submittedAt: 'Submitted',
              reviewedAt: 'Reviewed',
              approve: 'Approve',
              reject: 'Reject',
              status: {
                pending: 'Pending',
                approved: 'Approved',
                rejected: 'Rejected'
              }
            }
          }
        }
      }
    })

    // Mock admin store methods
    const adminStore = useAdminStore()
    adminStore.hoursSuggestions = []
    adminStore.pendingSuggestionsCount = 0
    adminStore.loading = false
    adminStore.error = null

    vi.spyOn(adminStore, 'fetchHoursSuggestions').mockResolvedValue({ data: [], error: null })
    vi.spyOn(adminStore, 'fetchPendingSuggestionsCount').mockResolvedValue()
    vi.spyOn(adminStore, 'reviewSuggestion').mockResolvedValue({ error: null })
  })

  test('renders tabs correctly', async () => {
    const wrapper = mount(HoursSuggestionsList, {
      global: {
        plugins: [pinia, i18n],
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Pending')
    expect(wrapper.text()).toContain('Approved')
    expect(wrapper.text()).toContain('Rejected')
  })

  test('shows pending count badge on pending tab', async () => {
    const adminStore = useAdminStore()
    adminStore.pendingSuggestionsCount = 5

    const wrapper = mount(HoursSuggestionsList, {
      global: {
        plugins: [pinia, i18n],
        stubs: { RouterLink: RouterLinkStub }
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('5')
  })

  test('renders pending suggestions', async () => {
    const adminStore = useAdminStore()
    adminStore.hoursSuggestions = [mockSuggestion]

    const wrapper = mount(HoursSuggestionsList, {
      global: {
        plugins: [pinia, i18n],
        stubs: { RouterLink: RouterLinkStub }
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Test Location')
    expect(wrapper.text()).toContain('Hours have changed')
  })

  test('shows hours comparison', async () => {
    const adminStore = useAdminStore()
    adminStore.hoursSuggestions = [mockSuggestion]

    const wrapper = mount(HoursSuggestionsList, {
      global: {
        plugins: [pinia, i18n],
        stubs: { RouterLink: RouterLinkStub }
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Current Hours')
    expect(wrapper.text()).toContain('Suggested Hours')
  })

  test('approve button exists for pending suggestions', async () => {
    const adminStore = useAdminStore()
    adminStore.hoursSuggestions = [mockSuggestion]

    const wrapper = mount(HoursSuggestionsList, {
      global: {
        plugins: [pinia, i18n],
        stubs: { RouterLink: RouterLinkStub }
      }
    })

    await flushPromises()

    const approveButtons = wrapper.findAll('button').filter(btn => btn.text().includes('Approve'))
    expect(approveButtons.length).toBeGreaterThan(0)
  })

  test('reject button exists for pending suggestions', async () => {
    const adminStore = useAdminStore()
    adminStore.hoursSuggestions = [mockSuggestion]

    const wrapper = mount(HoursSuggestionsList, {
      global: {
        plugins: [pinia, i18n],
        stubs: { RouterLink: RouterLinkStub }
      }
    })

    await flushPromises()

    const rejectButtons = wrapper.findAll('button').filter(btn => btn.text().includes('Reject'))
    expect(rejectButtons.length).toBeGreaterThan(0)
  })

  test('shows loading state', async () => {
    const adminStore = useAdminStore()
    adminStore.loading = true

    const wrapper = mount(HoursSuggestionsList, {
      global: {
        plugins: [pinia, i18n],
        stubs: { RouterLink: RouterLinkStub }
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Loading suggestions...')
  })

  test('shows empty state when no suggestions', async () => {
    const adminStore = useAdminStore()
    adminStore.hoursSuggestions = []

    const wrapper = mount(HoursSuggestionsList, {
      global: {
        plugins: [pinia, i18n],
        stubs: { RouterLink: RouterLinkStub }
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('No suggestions found')
  })

  test('filters suggestions by status', async () => {
    const adminStore = useAdminStore()
    const approvedSuggestion = { ...mockSuggestion, id: 'test-id-2', status: 'approved' as const }
    adminStore.hoursSuggestions = [mockSuggestion, approvedSuggestion]

    const wrapper = mount(HoursSuggestionsList, {
      global: {
        plugins: [pinia, i18n],
        stubs: { RouterLink: RouterLinkStub }
      }
    })

    await flushPromises()

    // Initially shows pending
    expect(wrapper.text()).toContain('Test Location')

    // Click on Approved tab
    const approvedTab = wrapper.findAll('button').find(btn => btn.text().includes('Approved'))
    await approvedTab!.trigger('click')
    await flushPromises()

    // Should still show the suggestion (it's in the list with status approved)
    expect(wrapper.text()).toContain('Test Location')
  })

  test('hides action buttons for non-pending suggestions', async () => {
    const adminStore = useAdminStore()
    const approvedSuggestion = { ...mockSuggestion, status: 'approved' as const, reviewed_at: new Date().toISOString() }
    adminStore.hoursSuggestions = [approvedSuggestion]

    const wrapper = mount(HoursSuggestionsList, {
      global: {
        plugins: [pinia, i18n],
        stubs: { RouterLink: RouterLinkStub }
      }
    })

    await flushPromises()

    // Switch to approved tab
    const approvedTab = wrapper.findAll('button').find(btn => btn.text().includes('Approved'))
    await approvedTab!.trigger('click')
    await flushPromises()

    // Should not have Approve/Reject buttons
    const approveButton = wrapper.findAll('button').find(btn => btn.text() === 'Approve')
    expect(approveButton).toBeUndefined()
  })
})
