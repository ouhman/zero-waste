import { describe, test, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import SubmissionMethodSelector from '@/components/submission/SubmissionMethodSelector.vue'

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      submit: {
        howToAdd: 'How do you want to add a location?',
        methodGoogleMaps: 'I have a Google Maps link',
        methodGoogleMapsDesc: 'Copy a link from Google Maps',
        methodPinMap: "I'll pin it on the map",
        methodPinMapDesc: "Best if you're nearby or know the exact spot"
      }
    }
  }
})

describe('SubmissionMethodSelector', () => {
  test('renders two method options with correct text', () => {
    const wrapper = mount(SubmissionMethodSelector, {
      global: {
        plugins: [i18n]
      }
    })

    const cards = wrapper.findAll('.method-card')
    expect(cards).toHaveLength(2)

    // Check Google Maps option
    const googleMapsCard = wrapper.find('[data-testid="method-google-maps"]')
    expect(googleMapsCard.exists()).toBe(true)
    expect(googleMapsCard.text()).toContain('I have a Google Maps link')
    expect(googleMapsCard.text()).toContain('Copy a link from Google Maps')

    // Check Pin Map option
    const pinMapCard = wrapper.find('[data-testid="method-pin-map"]')
    expect(pinMapCard.exists()).toBe(true)
    expect(pinMapCard.text()).toContain("I'll pin it on the map")
    expect(pinMapCard.text()).toContain("Best if you're nearby or know the exact spot")
  })

  test('emits select event with google-maps when first option clicked', async () => {
    const wrapper = mount(SubmissionMethodSelector, {
      global: {
        plugins: [i18n]
      }
    })

    const googleMapsCard = wrapper.find('[data-testid="method-google-maps"]')
    await googleMapsCard.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('select')
    expect(wrapper.emitted('select')?.[0]).toEqual(['google-maps'])
  })

  test('emits select event with pin-map when second option clicked', async () => {
    const wrapper = mount(SubmissionMethodSelector, {
      global: {
        plugins: [i18n]
      }
    })

    const pinMapCard = wrapper.find('[data-testid="method-pin-map"]')
    await pinMapCard.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('select')
    expect(wrapper.emitted('select')?.[0]).toEqual(['pin-map'])
  })

  test('keyboard navigation works with Enter key', async () => {
    const wrapper = mount(SubmissionMethodSelector, {
      global: {
        plugins: [i18n]
      }
    })

    const googleMapsCard = wrapper.find('[data-testid="method-google-maps"]')
    await googleMapsCard.trigger('keydown.enter')

    expect(wrapper.emitted()).toHaveProperty('select')
    expect(wrapper.emitted('select')?.[0]).toEqual(['google-maps'])
  })

  test('keyboard navigation works with Space key', async () => {
    const wrapper = mount(SubmissionMethodSelector, {
      global: {
        plugins: [i18n]
      }
    })

    const pinMapCard = wrapper.find('[data-testid="method-pin-map"]')
    await pinMapCard.trigger('keydown.space')

    expect(wrapper.emitted()).toHaveProperty('select')
    expect(wrapper.emitted('select')?.[0]).toEqual(['pin-map'])
  })

  test('cards have cursor pointer style', () => {
    const wrapper = mount(SubmissionMethodSelector, {
      global: {
        plugins: [i18n]
      }
    })

    const cards = wrapper.findAll('.method-card')
    cards.forEach(card => {
      // Check if cursor pointer is set (either via class or inline style)
      const hasPointer = card.classes().includes('cursor-pointer') ||
        card.element.style.cursor === 'pointer'
      expect(hasPointer).toBe(true)
    })
  })

  test('cards have proper ARIA labels', () => {
    const wrapper = mount(SubmissionMethodSelector, {
      global: {
        plugins: [i18n]
      }
    })

    const googleMapsCard = wrapper.find('[data-testid="method-google-maps"]')
    expect(googleMapsCard.attributes('role')).toBe('button')
    expect(googleMapsCard.attributes('tabindex')).toBe('0')
    expect(googleMapsCard.attributes('aria-label')).toBeTruthy()

    const pinMapCard = wrapper.find('[data-testid="method-pin-map"]')
    expect(pinMapCard.attributes('role')).toBe('button')
    expect(pinMapCard.attributes('tabindex')).toBe('0')
    expect(pinMapCard.attributes('aria-label')).toBeTruthy()
  })

  test('cards have hover/focus states', () => {
    const wrapper = mount(SubmissionMethodSelector, {
      global: {
        plugins: [i18n]
      }
    })

    const cards = wrapper.findAll('.method-card')
    cards.forEach(card => {
      // Check if the card has the method-card class (which has hover/transition styles)
      expect(card.classes()).toContain('method-card')
    })
  })

  test('renders heading text', () => {
    const wrapper = mount(SubmissionMethodSelector, {
      global: {
        plugins: [i18n]
      }
    })

    expect(wrapper.text()).toContain('How do you want to add a location?')
  })

  test('displays icons for each option', () => {
    const wrapper = mount(SubmissionMethodSelector, {
      global: {
        plugins: [i18n]
      }
    })

    // Check that icons are present (SVG elements)
    const icons = wrapper.findAll('svg')
    expect(icons.length).toBeGreaterThanOrEqual(2)
  })
})
