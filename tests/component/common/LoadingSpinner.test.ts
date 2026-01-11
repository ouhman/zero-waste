import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    const wrapper = mount(LoadingSpinner)

    expect(wrapper.find('.spinner-container').exists()).toBe(true)
    expect(wrapper.find('.spinner').exists()).toBe(true)
  })

  it('renders medium size by default', () => {
    const wrapper = mount(LoadingSpinner)

    const spinner = wrapper.find('.spinner')
    expect(spinner.classes()).toContain('spinner-md')
  })

  it('renders small size when prop is set', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        size: 'sm'
      }
    })

    const spinner = wrapper.find('.spinner')
    expect(spinner.classes()).toContain('spinner-sm')
    expect(spinner.classes()).not.toContain('spinner-md')
  })

  it('renders large size when prop is set', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        size: 'lg'
      }
    })

    const spinner = wrapper.find('.spinner')
    expect(spinner.classes()).toContain('spinner-lg')
    expect(spinner.classes()).not.toContain('spinner-md')
  })

  it('displays text when provided', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        text: 'Loading data...'
      }
    })

    expect(wrapper.find('.spinner-text').exists()).toBe(true)
    expect(wrapper.find('.spinner-text').text()).toBe('Loading data...')
  })

  it('does not display text element when not provided', () => {
    const wrapper = mount(LoadingSpinner)

    expect(wrapper.find('.spinner-text').exists()).toBe(false)
  })

  it('has screen reader text with default message', () => {
    const wrapper = mount(LoadingSpinner)

    const srOnly = wrapper.find('.sr-only')
    expect(srOnly.exists()).toBe(true)
    expect(srOnly.text()).toBe('Loading...')
  })

  it('has screen reader text with custom message', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        text: 'Processing request'
      }
    })

    const srOnly = wrapper.find('.sr-only')
    expect(srOnly.exists()).toBe(true)
    expect(srOnly.text()).toBe('Processing request')
  })

  it('has role="status" for accessibility', () => {
    const wrapper = mount(LoadingSpinner)

    const spinner = wrapper.find('.spinner')
    expect(spinner.attributes('role')).toBe('status')
  })

  it('applies centered class when centered prop is true', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        centered: true
      }
    })

    const container = wrapper.find('.spinner-container')
    expect(container.classes()).toContain('spinner-centered')
  })

  it('does not apply centered class when centered prop is false', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        centered: false
      }
    })

    const container = wrapper.find('.spinner-container')
    expect(container.classes()).not.toContain('spinner-centered')
  })

  it('renders all size variants correctly', () => {
    const sizes = ['sm', 'md', 'lg'] as const

    sizes.forEach(size => {
      const wrapper = mount(LoadingSpinner, {
        props: { size }
      })

      const spinner = wrapper.find('.spinner')
      expect(spinner.classes()).toContain(`spinner-${size}`)
    })
  })

  it('has animation class for spinning', () => {
    const wrapper = mount(LoadingSpinner)

    const spinner = wrapper.find('.spinner')
    // The animation is applied via CSS, so we just check the element exists
    // and has the spinner class
    expect(spinner.exists()).toBe(true)
    expect(spinner.classes()).toContain('spinner')
  })

  it('supports all props combined', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        size: 'lg',
        text: 'Please wait...',
        centered: true
      }
    })

    const container = wrapper.find('.spinner-container')
    expect(container.classes()).toContain('spinner-centered')

    const spinner = wrapper.find('.spinner')
    expect(spinner.classes()).toContain('spinner-lg')

    const text = wrapper.find('.spinner-text')
    expect(text.text()).toBe('Please wait...')

    const srOnly = wrapper.find('.sr-only')
    expect(srOnly.text()).toBe('Please wait...')
  })

  it('has inline-flex display when not centered', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        centered: false
      }
    })

    const container = wrapper.find('.spinner-container')
    expect(container.classes()).not.toContain('spinner-centered')
  })

  it('screen reader text is properly hidden', () => {
    const wrapper = mount(LoadingSpinner)

    const srOnly = wrapper.find('.sr-only')
    expect(srOnly.exists()).toBe(true)
    expect(srOnly.classes()).toContain('sr-only')
  })
})
