import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSpinner from '../LoadingSpinner.vue'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    const wrapper = mount(LoadingSpinner)

    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
    expect(wrapper.find('.spinner').exists()).toBe(true)
    expect(wrapper.find('.sr-only').text()).toBe('Loading')
  })

  it('renders with custom text', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        text: 'Loading data...'
      }
    })

    expect(wrapper.find('.spinner-text').exists()).toBe(true)
    expect(wrapper.find('.spinner-text').text()).toBe('Loading data...')
  })

  it('renders with custom aria label', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        ariaLabel: 'Searching for locations'
      }
    })

    expect(wrapper.find('.sr-only').text()).toBe('Searching for locations')
    expect(wrapper.attributes('aria-label')).toBe('Searching for locations')
  })

  it('does not render text element when text prop is empty', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        text: ''
      }
    })

    expect(wrapper.find('.spinner-text').exists()).toBe(false)
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        ariaLabel: 'Loading content'
      }
    })

    const spinner = wrapper.find('.loading-spinner')
    expect(spinner.attributes('role')).toBe('status')
    expect(spinner.attributes('aria-label')).toBe('Loading content')
  })

  it('renders both visible text and screen reader text', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        text: 'Please wait',
        ariaLabel: 'Loading data'
      }
    })

    expect(wrapper.find('.spinner-text').text()).toBe('Please wait')
    expect(wrapper.find('.sr-only').text()).toBe('Loading data')
  })
})
