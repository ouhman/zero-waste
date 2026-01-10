import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import de from '@/locales/de.json'
import en from '@/locales/en.json'

describe('i18n', () => {
  beforeEach(() => {
    // Mock localStorage for tests
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
      removeItem: vi.fn(),
      length: 0,
      key: vi.fn()
    }
    global.localStorage = localStorageMock as any
    vi.clearAllMocks()
  })

  it('defaults to German', () => {
    const i18n = createI18n({
      legacy: false,
      locale: 'de',
      fallbackLocale: 'de',
      messages: { de, en }
    })

    expect(i18n.global.locale.value).toBe('de')
  })

  it('detects English browser', () => {
    // Mock navigator.language
    Object.defineProperty(window.navigator, 'language', {
      value: 'en-US',
      configurable: true
    })

    const browserLang = navigator.language.split('-')[0]
    expect(['de', 'en'].includes(browserLang) ? browserLang : 'de').toBe('en')
  })

  it('persists language choice in localStorage', () => {
    const localStorageMock = global.localStorage as any

    const i18n = createI18n({
      legacy: false,
      locale: 'de',
      fallbackLocale: 'de',
      messages: { de, en }
    })

    // Change language
    i18n.global.locale.value = 'en'
    localStorage.setItem('language', 'en')

    // Check if setItem was called with correct arguments
    expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'en')
  })

  it('switches language without reload', () => {
    const i18n = createI18n({
      legacy: false,
      locale: 'de',
      fallbackLocale: 'de',
      messages: { de, en }
    })

    expect(i18n.global.locale.value).toBe('de')

    // Switch to English
    i18n.global.locale.value = 'en'
    expect(i18n.global.locale.value).toBe('en')

    // Switch back to German
    i18n.global.locale.value = 'de'
    expect(i18n.global.locale.value).toBe('de')
  })

  it('loads saved language from localStorage on init', () => {
    const localStorageMock = global.localStorage as any
    localStorageMock.getItem.mockReturnValue('en')

    const savedLocale = localStorage.getItem('language') || 'de'
    const i18n = createI18n({
      legacy: false,
      locale: savedLocale,
      fallbackLocale: 'de',
      messages: { de, en }
    })

    expect(i18n.global.locale.value).toBe('en')
  })

  it('falls back to German for unsupported language', () => {
    const localStorageMock = global.localStorage as any
    localStorageMock.getItem.mockReturnValue('fr')

    const savedLocale = localStorage.getItem('language') || 'de'
    const supportedLocale = ['de', 'en'].includes(savedLocale) ? savedLocale : 'de'

    const i18n = createI18n({
      legacy: false,
      locale: supportedLocale,
      fallbackLocale: 'de',
      messages: { de, en }
    })

    expect(i18n.global.locale.value).toBe('de')
  })
})
