import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import FieldBadge from '../FieldBadge.vue'

// Mock i18n
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      submit: {
        autoFilledFrom: 'From OpenStreetMap',
        autoFilledFromWebsite: 'From website',
        clearAutoFilled: 'Clear auto-filled value'
      }
    }
  }
})

describe('FieldBadge', () => {
  const mountWithI18n = (props: any) => {
    return mount(FieldBadge, {
      props,
      global: {
        plugins: [i18n]
      }
    })
  }

  it('does not render when show is false', () => {
    const wrapper = mountWithI18n({
      show: false
    })

    expect(wrapper.find('.field-badge').exists()).toBe(false)
  })

  it('renders when show is true', () => {
    const wrapper = mountWithI18n({
      show: true
    })

    expect(wrapper.find('.field-badge').exists()).toBe(true)
  })

  it('displays OSM source text and icon', () => {
    const wrapper = mountWithI18n({
      show: true,
      source: 'osm'
    })

    expect(wrapper.find('.badge-text').text()).toBe('From OpenStreetMap')
    expect(wrapper.find('.badge-icon').text()).toBe('🗺️')
  })

  it('displays website source text and icon', () => {
    const wrapper = mountWithI18n({
      show: true,
      source: 'website'
    })

    expect(wrapper.find('.badge-text').text()).toBe('From website')
    expect(wrapper.find('.badge-icon').text()).toBe('🌐')
  })

  it('shows clear button when clearable is true', () => {
    const wrapper = mountWithI18n({
      show: true,
      clearable: true
    })

    expect(wrapper.find('.badge-clear').exists()).toBe(true)
  })

  it('hides clear button when clearable is false', () => {
    const wrapper = mountWithI18n({
      show: true,
      clearable: false
    })

    expect(wrapper.find('.badge-clear').exists()).toBe(false)
  })

  it('emits clear event when clear button is clicked', async () => {
    const wrapper = mountWithI18n({
      show: true,
      clearable: true
    })

    await wrapper.find('.badge-clear').trigger('click')

    expect(wrapper.emitted()).toHaveProperty('clear')
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('has proper aria-label on clear button', () => {
    const wrapper = mountWithI18n({
      show: true,
      clearable: true
    })

    const clearButton = wrapper.find('.badge-clear')
    expect(clearButton.attributes('aria-label')).toBe('Clear auto-filled value')
  })

  it('applies info variant styling by default', () => {
    const wrapper = mountWithI18n({
      show: true,
      variant: 'info'
    })

    expect(wrapper.find('.field-badge').classes()).toContain('info')
  })

  it('applies success variant styling', () => {
    const wrapper = mountWithI18n({
      show: true,
      variant: 'success'
    })

    expect(wrapper.find('.field-badge').classes()).toContain('success')
  })

  it('applies warning variant styling', () => {
    const wrapper = mountWithI18n({
      show: true,
      variant: 'warning'
    })

    expect(wrapper.find('.field-badge').classes()).toContain('warning')
  })

  it('clear button is keyboard accessible', () => {
    const wrapper = mountWithI18n({
      show: true,
      clearable: true
    })

    const clearButton = wrapper.find('.badge-clear')
    expect(clearButton.attributes('type')).toBe('button')
  })

  it('badge icon is marked as decorative with aria-hidden', () => {
    const wrapper = mountWithI18n({
      show: true
    })

    const icon = wrapper.find('.badge-icon')
    expect(icon.attributes('aria-hidden')).toBe('true')
  })

  it('does not render container when show is false', () => {
    const wrapper = mountWithI18n({
      show: false
    })

    expect(wrapper.find('.field-badge-container').exists()).toBe(false)
  })

  it('renders complete badge structure', () => {
    const wrapper = mountWithI18n({
      show: true,
      source: 'osm',
      clearable: true
    })

    expect(wrapper.find('.field-badge-container').exists()).toBe(true)
    expect(wrapper.find('.field-badge').exists()).toBe(true)
    expect(wrapper.find('.badge-icon').exists()).toBe(true)
    expect(wrapper.find('.badge-text').exists()).toBe(true)
    expect(wrapper.find('.badge-clear').exists()).toBe(true)
  })
})
