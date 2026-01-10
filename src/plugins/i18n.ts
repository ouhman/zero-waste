import { createI18n } from 'vue-i18n'
import de from '@/locales/de.json'
import en from '@/locales/en.json'

// Detect browser language
function getBrowserLanguage(): string {
  const browserLang = navigator.language.split('-')[0]
  return ['de', 'en'].includes(browserLang) ? browserLang : 'de'
}

// Get saved language or default
function getInitialLocale(): string {
  const saved = localStorage.getItem('language')
  if (saved && ['de', 'en'].includes(saved)) {
    return saved
  }
  return getBrowserLanguage()
}

export const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: getInitialLocale(),
  fallbackLocale: 'de',
  messages: {
    de,
    en
  }
})

// Watch for locale changes and persist to localStorage
if (typeof window !== 'undefined') {
  const locale = i18n.global.locale
  if (typeof locale === 'object' && 'value' in locale) {
    // Watch is handled in the component
  }
}

export function setLanguage(lang: 'de' | 'en') {
  i18n.global.locale.value = lang
  localStorage.setItem('language', lang)
}
