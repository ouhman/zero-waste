import { describe, test, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import GoogleMapsTutorial from '@/components/submission/GoogleMapsTutorial.vue'

// Mock i18n
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      submit: {
        tutorialIntro: 'Follow these easy steps',
        tutorialStep1: 'Find the location on Google Maps',
        tutorialStep1Desc: 'Search or navigate to the place you want to add',
        tutorialStep2: 'Copy the URL from your browser\'s address bar',
        tutorialStep2Desc: 'Select all and copy (Ctrl+C / Cmd+C)',
        tutorialStep3: 'Paste the URL below',
        letsDoThis: 'Let\'s do this!',
        openGoogleMaps: 'Open Google Maps',
        pasteLink: 'Paste your Google Maps link here',
        back: 'Back'
      }
    }
  }
})

describe('GoogleMapsTutorial', () => {
  beforeEach(() => {
    // Reset userAgent to desktop
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true
    })
  })

  test('renders tutorial intro and all 3 steps with correct text', () => {
    const wrapper = mount(GoogleMapsTutorial, {
      global: {
        plugins: [i18n]
      }
    })

    // Check intro and all 3 steps are present
    expect(wrapper.text()).toContain('Follow these easy steps')
    expect(wrapper.text()).toContain('Find the location on Google Maps')
    expect(wrapper.text()).toContain('Search or navigate to the place you want to add')
    expect(wrapper.text()).toContain('Copy the URL from your browser\'s address bar')
    expect(wrapper.text()).toContain('Select all and copy (Ctrl+C / Cmd+C)')
    expect(wrapper.text()).toContain('Paste the URL below')
    expect(wrapper.text()).toContain('Let\'s do this!')
  })

  test('displays step numbers 1-3', () => {
    const wrapper = mount(GoogleMapsTutorial, {
      global: {
        plugins: [i18n]
      }
    })

    const stepNumbers = wrapper.findAll('.step-number')
    expect(stepNumbers).toHaveLength(3)
    expect(stepNumbers[0].text()).toBe('1')
    expect(stepNumbers[1].text()).toBe('2')
    expect(stepNumbers[2].text()).toBe('3')
  })

  test('displays tutorial video', () => {
    const wrapper = mount(GoogleMapsTutorial, {
      global: {
        plugins: [i18n]
      }
    })

    const videoSection = wrapper.find('[data-testid="tutorial-video"]')
    expect(videoSection.exists()).toBe(true)
  })

  test('"Open Google Maps" button has correct href for desktop', () => {
    const wrapper = mount(GoogleMapsTutorial, {
      global: {
        plugins: [i18n]
      }
    })

    const button = wrapper.find('[data-testid="open-google-maps"]')
    expect(button.exists()).toBe(true)
    expect(button.attributes('href')).toBe('https://maps.google.com')
    expect(button.attributes('target')).toBe('_blank')
    expect(button.attributes('rel')).toBe('noopener noreferrer')
  })

  test('"Open Google Maps" button has cursor pointer', () => {
    const wrapper = mount(GoogleMapsTutorial, {
      global: {
        plugins: [i18n]
      }
    })

    const button = wrapper.find('[data-testid="open-google-maps"]')
    expect(button.classes()).toContain('cursor-pointer')
  })

  test('URL input field exists and works', async () => {
    const wrapper = mount(GoogleMapsTutorial, {
      global: {
        plugins: [i18n]
      }
    })

    const input = wrapper.find('[data-testid="url-input"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('url')
    expect(input.attributes('placeholder')).toBe('Paste your Google Maps link here')

    // Test v-model binding
    await input.setValue('https://maps.google.com/test')
    expect((input.element as HTMLInputElement).value).toBe('https://maps.google.com/test')
  })

  test('emits url-submitted event when input changes and has value', async () => {
    const wrapper = mount(GoogleMapsTutorial, {
      global: {
        plugins: [i18n]
      }
    })

    const input = wrapper.find('[data-testid="url-input"]')
    await input.setValue('https://maps.google.com/test')

    // Trigger input event
    await input.trigger('input')

    expect(wrapper.emitted()).toHaveProperty('url-submitted')
    expect(wrapper.emitted('url-submitted')?.[0]).toEqual(['https://maps.google.com/test'])
  })

  test('does not emit url-submitted when input is empty', async () => {
    const wrapper = mount(GoogleMapsTutorial, {
      global: {
        plugins: [i18n]
      }
    })

    const input = wrapper.find('[data-testid="url-input"]')
    await input.setValue('')
    await input.trigger('input')

    expect(wrapper.emitted('url-submitted')).toBeUndefined()
  })

  test('back button exists and emits back event', async () => {
    const wrapper = mount(GoogleMapsTutorial, {
      global: {
        plugins: [i18n]
      }
    })

    const backButton = wrapper.find('[data-testid="back-button"]')
    expect(backButton.exists()).toBe(true)
    expect(backButton.text()).toContain('Back')
    expect(backButton.classes()).toContain('cursor-pointer')

    await backButton.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('back')
    expect(wrapper.emitted('back')).toHaveLength(1)
  })

  test('detects mobile platform (Android)', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
      configurable: true
    })

    const wrapper = mount(GoogleMapsTutorial, {
      global: {
        plugins: [i18n]
      }
    })

    const button = wrapper.find('[data-testid="open-google-maps"]')
    // Should still use https://maps.google.com (will open app if installed)
    expect(button.attributes('href')).toBe('https://maps.google.com')
  })

  test('detects mobile platform (iOS)', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true
    })

    const wrapper = mount(GoogleMapsTutorial, {
      global: {
        plugins: [i18n]
      }
    })

    const button = wrapper.find('[data-testid="open-google-maps"]')
    expect(button.attributes('href')).toBe('https://maps.google.com')
  })

  test('keyboard navigation: back button responds to Enter key', async () => {
    const wrapper = mount(GoogleMapsTutorial, {
      global: {
        plugins: [i18n]
      }
    })

    const backButton = wrapper.find('[data-testid="back-button"]')
    await backButton.trigger('keydown.enter')

    expect(wrapper.emitted()).toHaveProperty('back')
  })

  test('has proper ARIA labels for accessibility', () => {
    const wrapper = mount(GoogleMapsTutorial, {
      global: {
        plugins: [i18n]
      }
    })

    const urlInput = wrapper.find('[data-testid="url-input"]')
    expect(urlInput.attributes('aria-label')).toBeDefined()

    const backButton = wrapper.find('[data-testid="back-button"]')
    expect(backButton.attributes('aria-label')).toBeDefined()
  })

  test('Open Google Maps button has proper ARIA label', () => {
    const wrapper = mount(GoogleMapsTutorial, {
      global: {
        plugins: [i18n]
      }
    })

    const button = wrapper.find('[data-testid="open-google-maps"]')
    expect(button.attributes('aria-label')).toContain('Open Google Maps')
  })
})
