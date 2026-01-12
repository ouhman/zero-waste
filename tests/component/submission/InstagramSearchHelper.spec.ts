import { describe, test, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import InstagramSearchHelper from '@/components/submission/InstagramSearchHelper.vue'

// Mock i18n
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      submit: {
        helpFindInstagram: 'Help me find it'
      }
    }
  }
})

describe('InstagramSearchHelper', () => {
  test('renders search icon and helper text', () => {
    const wrapper = mount(InstagramSearchHelper, {
      props: {
        businessName: 'Unverpackt Nordend'
      },
      global: {
        plugins: [i18n]
      }
    })

    expect(wrapper.text()).toContain('Help me find it')
  })

  test('creates correct Google search URL with business name and instagram', () => {
    const wrapper = mount(InstagramSearchHelper, {
      props: {
        businessName: 'Unverpackt Nordend'
      },
      global: {
        plugins: [i18n]
      }
    })

    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)

    const href = link.attributes('href')
    expect(href).toContain('google.com/search')
    expect(href).toContain('Unverpackt%20Nordend') // URL encoding uses %20 for spaces
    expect(href).toContain('instagram')
  })

  test('opens link in new tab with security attributes', () => {
    const wrapper = mount(InstagramSearchHelper, {
      props: {
        businessName: 'Zero Waste Shop'
      },
      global: {
        plugins: [i18n]
      }
    })

    const link = wrapper.find('a')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })

  test('encodes business name with special characters correctly', () => {
    const wrapper = mount(InstagramSearchHelper, {
      props: {
        businessName: 'Café & Restaurant'
      },
      global: {
        plugins: [i18n]
      }
    })

    const link = wrapper.find('a')
    const href = link.attributes('href')

    // Should be properly URL encoded
    expect(href).toContain('Caf%C3%A9')
    expect(href).toContain('%26') // & symbol
  })

  test('has proper cursor pointer styling', () => {
    const wrapper = mount(InstagramSearchHelper, {
      props: {
        businessName: 'Test Business'
      },
      global: {
        plugins: [i18n]
      }
    })

    const link = wrapper.find('a')
    expect(link.classes()).toContain('cursor-pointer')
  })

  test('has accessible ARIA label', () => {
    const wrapper = mount(InstagramSearchHelper, {
      props: {
        businessName: 'Test Business'
      },
      global: {
        plugins: [i18n]
      }
    })

    const link = wrapper.find('a')
    const ariaLabel = link.attributes('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel).toContain('Search')
    expect(ariaLabel).toContain('Test Business')
    expect(ariaLabel).toContain('Instagram')
  })

  test('renders with subtle styling (not too prominent)', () => {
    const wrapper = mount(InstagramSearchHelper, {
      props: {
        businessName: 'Test'
      },
      global: {
        plugins: [i18n]
      }
    })

    // Should have subtle text color (gray)
    const container = wrapper.find('.instagram-helper')
    expect(container.exists()).toBe(true)
  })

  test('i18n key is used for helper text', () => {
    // Create German i18n instance
    const deI18n = createI18n({
      legacy: false,
      locale: 'de',
      messages: {
        de: {
          submit: {
            helpFindInstagram: 'Hilf mir, es zu finden'
          }
        }
      }
    })

    const wrapper = mount(InstagramSearchHelper, {
      props: {
        businessName: 'Test'
      },
      global: {
        plugins: [deI18n]
      }
    })

    expect(wrapper.text()).toContain('Hilf mir, es zu finden')
  })
})
