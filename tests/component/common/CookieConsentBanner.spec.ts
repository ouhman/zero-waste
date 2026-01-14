import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createI18n } from 'vue-i18n'
import CookieConsentBanner from '@/components/common/CookieConsentBanner.vue'

// Mock useConsent
const mockAccept = vi.fn()
const mockDecline = vi.fn()
const mockShowBanner = ref(true)

vi.mock('@/composables/useConsent', () => ({
  useConsent: () => ({
    showBanner: mockShowBanner,
    acceptAnalytics: mockAccept,
    declineAnalytics: mockDecline,
  }),
}))

describe('CookieConsentBanner', () => {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      en: {
        consent: {
          title: 'Help us improve',
          description: 'We use cookies...',
          accept: 'Accept',
          decline: 'Decline',
        },
      },
    },
  })

  beforeEach(() => {
    mockAccept.mockClear()
    mockDecline.mockClear()
    mockShowBanner.value = true
  })

  it('renders when showBanner is true', () => {
    const wrapper = mount(CookieConsentBanner, {
      global: { plugins: [i18n] },
    })
    expect(wrapper.find('.cookie-banner').exists()).toBe(true)
  })

  it('calls acceptAnalytics on accept click', async () => {
    const wrapper = mount(CookieConsentBanner, {
      global: { plugins: [i18n] },
    })
    await wrapper.find('.btn-primary').trigger('click')
    expect(mockAccept).toHaveBeenCalled()
  })

  it('calls declineAnalytics on decline click', async () => {
    const wrapper = mount(CookieConsentBanner, {
      global: { plugins: [i18n] },
    })
    await wrapper.find('.btn-secondary').trigger('click')
    expect(mockDecline).toHaveBeenCalled()
  })
})
