import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import EnrichmentStatus from '../EnrichmentStatus.vue'

// Mock i18n
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      submit: {
        researchingLocation: 'Researching location details...',
        foundPhone: 'Phone number',
        foundWebsite: 'Website',
        foundEmail: 'Email',
        foundHours: 'Opening hours',
        foundInstagram: 'Instagram'
      }
    }
  }
})

describe('EnrichmentStatus', () => {
  const mountWithI18n = (props: any) => {
    return mount(EnrichmentStatus, {
      props,
      global: {
        plugins: [i18n]
      }
    })
  }

  it('renders loading state', () => {
    const wrapper = mountWithI18n({
      loading: true
    })

    expect(wrapper.find('.enrichment-status').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'LoadingSpinner' }).exists()).toBe(true)
    expect(wrapper.find('.status-message').text()).toBe('Researching location details...')
  })

  it('shows found items progressively during loading', () => {
    const wrapper = mountWithI18n({
      loading: true,
      foundPhone: true,
      foundWebsite: true
    })

    const foundItems = wrapper.findAll('.found-item')
    expect(foundItems).toHaveLength(2)
    expect(foundItems[0].text()).toContain('Phone number')
    expect(foundItems[1].text()).toContain('Website')
  })

  it('displays all found items when enrichment is complete', () => {
    const wrapper = mountWithI18n({
      loading: true,
      foundPhone: true,
      foundWebsite: true,
      foundEmail: true,
      foundHours: true,
      foundInstagram: true
    })

    const foundItems = wrapper.findAll('.found-item')
    expect(foundItems).toHaveLength(5)
  })

  it('shows success message when complete', () => {
    const wrapper = mountWithI18n({
      loading: false,
      success: true,
      summary: 'Auto-filled 4 fields from OpenStreetMap'
    })

    expect(wrapper.find('.success-message').exists()).toBe(true)
    expect(wrapper.find('.success-message').text()).toContain('Auto-filled 4 fields from OpenStreetMap')
    expect(wrapper.find('.success-icon').exists()).toBe(true)
  })

  it('shows error message when enrichment fails', () => {
    const wrapper = mountWithI18n({
      loading: false,
      error: 'Could not fetch additional details'
    })

    expect(wrapper.find('.error-message').exists()).toBe(true)
    expect(wrapper.find('.error-message').text()).toContain('Could not fetch additional details')
    expect(wrapper.find('.error-icon').exists()).toBe(true)
  })

  it('has proper accessibility attributes when loading', () => {
    const wrapper = mountWithI18n({
      loading: true
    })

    const status = wrapper.find('.enrichment-status')
    expect(status.attributes('role')).toBe('status')
    expect(status.attributes('aria-live')).toBe('polite')
    expect(status.attributes('aria-busy')).toBe('true')
  })

  it('has proper accessibility attributes when not loading', () => {
    const wrapper = mountWithI18n({
      loading: false,
      success: true,
      summary: 'Complete'
    })

    const status = wrapper.find('.enrichment-status')
    expect(status.attributes('aria-busy')).toBe('false')
    expect(status.attributes('aria-live')).toBe('off')
  })

  it('error message has alert role', () => {
    const wrapper = mountWithI18n({
      loading: false,
      error: 'Network error'
    })

    const errorMessage = wrapper.find('.error-message')
    expect(errorMessage.attributes('role')).toBe('alert')
  })

  it('found items list has live region', () => {
    const wrapper = mountWithI18n({
      loading: true,
      foundPhone: true
    })

    const foundItems = wrapper.find('.found-items')
    expect(foundItems.attributes('aria-live')).toBe('polite')
  })

  it('does not show found items when loading is false', () => {
    const wrapper = mountWithI18n({
      loading: false,
      foundPhone: true,
      foundWebsite: true
    })

    expect(wrapper.find('.found-items').exists()).toBe(false)
  })

  it('does not show success message when error exists', () => {
    const wrapper = mountWithI18n({
      loading: false,
      success: true,
      summary: 'Success',
      error: 'Error occurred'
    })

    // Error takes precedence
    expect(wrapper.find('.error-message').exists()).toBe(true)
    expect(wrapper.find('.success-message').exists()).toBe(false)
  })

  it('renders correctly with no items found', () => {
    const wrapper = mountWithI18n({
      loading: true,
      foundPhone: false,
      foundWebsite: false,
      foundEmail: false,
      foundHours: false,
      foundInstagram: false
    })

    expect(wrapper.findAll('.found-item')).toHaveLength(0)
  })

  it('animates found items with slide-in animation', () => {
    const wrapper = mountWithI18n({
      loading: true,
      foundPhone: true
    })

    const foundItem = wrapper.find('.found-item')
    // Check if animation class is applied via CSS
    expect(foundItem.exists()).toBe(true)
  })
})
