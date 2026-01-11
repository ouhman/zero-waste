import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ToastContainer from '@/components/common/ToastContainer.vue'
import { useToast } from '@/composables/useToast'
import { flushPromises } from '../../utils/test-helpers'

describe('ToastContainer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Clear any existing toasts
    const { toasts } = useToast()
    toasts.value = []
  })

  it('renders empty when no toasts', () => {
    const { toasts } = useToast()
    expect(toasts.value).toHaveLength(0)
  })

  it('displays success toast with correct styling', async () => {
    const wrapper = mount(ToastContainer, {
      global: {
        stubs: {
          Teleport: true
        }
      }
    })
    const { success } = useToast()

    success('Operation successful!')
    await wrapper.vm.$nextTick()

    const toast = wrapper.find('.toast')
    expect(toast.exists()).toBe(true)
    expect(toast.classes()).toContain('toast-success')
    expect(toast.text()).toContain('Operation successful!')
    expect(toast.find('.toast-icon').text()).toBe('✓')
  })

  it('displays error toast with correct styling', async () => {
    const wrapper = mount(ToastContainer, {
      global: { stubs: { Teleport: true } }
    })
    const { error } = useToast()

    error('Something went wrong!')
    await wrapper.vm.$nextTick()

    const toast = wrapper.find('.toast')
    expect(toast.exists()).toBe(true)
    expect(toast.classes()).toContain('toast-error')
    expect(toast.text()).toContain('Something went wrong!')
    expect(toast.find('.toast-icon').text()).toBe('✕')
  })

  it('displays warning toast with correct styling', async () => {
    const wrapper = mount(ToastContainer, {
      global: { stubs: { Teleport: true } }
    })
    const { warning } = useToast()

    warning('Warning message!')
    await wrapper.vm.$nextTick()

    const toast = wrapper.find('.toast')
    expect(toast.exists()).toBe(true)
    expect(toast.classes()).toContain('toast-warning')
    expect(toast.text()).toContain('Warning message!')
    expect(toast.find('.toast-icon').text()).toBe('⚠')
  })

  it('displays info toast with correct styling', async () => {
    const wrapper = mount(ToastContainer, {
      global: { stubs: { Teleport: true } }
    })
    const { info } = useToast()

    info('Info message!')
    await wrapper.vm.$nextTick()

    const toast = wrapper.find('.toast')
    expect(toast.exists()).toBe(true)
    expect(toast.classes()).toContain('toast-info')
    expect(toast.text()).toContain('Info message!')
    expect(toast.find('.toast-icon').text()).toBe('ℹ')
  })

  it('displays multiple toasts simultaneously', async () => {
    const wrapper = mount(ToastContainer, {
      global: { stubs: { Teleport: true } }
    })
    const { success, error, warning } = useToast()

    success('Success message')
    error('Error message')
    warning('Warning message')
    await wrapper.vm.$nextTick()

    const toasts = wrapper.findAll('.toast')
    expect(toasts).toHaveLength(3)
    expect(toasts[0].classes()).toContain('toast-success')
    expect(toasts[1].classes()).toContain('toast-error')
    expect(toasts[2].classes()).toContain('toast-warning')
  })

  it('removes toast when close button is clicked', async () => {
    const wrapper = mount(ToastContainer, {
      global: { stubs: { Teleport: true } }
    })
    const { success } = useToast()

    success('Test message')
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.toast')).toHaveLength(1)

    const closeButton = wrapper.find('.toast-close')
    await closeButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.toast')).toHaveLength(0)
  })

  it('sets up auto-dismiss timer', async () => {
    const wrapper = mount(ToastContainer, {
      global: { stubs: { Teleport: true } }
    })
    const { show, toasts } = useToast()

    show({ message: 'Auto-dismiss test', duration: 1000 })
    await wrapper.vm.$nextTick()

    // Toast should be created with the specified duration
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].duration).toBe(1000)
  })

  it('has proper accessibility attributes', async () => {
    const wrapper = mount(ToastContainer, {
      global: { stubs: { Teleport: true } }
    })
    const { success } = useToast()

    success('Test message')
    await wrapper.vm.$nextTick()

    const toast = wrapper.find('.toast')
    expect(toast.attributes('role')).toBe('alert')

    const closeButton = wrapper.find('.toast-close')
    expect(closeButton.attributes('aria-label')).toBe('Close')
  })

  it('renders toasts with correct message content', async () => {
    const wrapper = mount(ToastContainer, {
      global: { stubs: { Teleport: true } }
    })
    const { success } = useToast()

    const message = 'This is a test message with special characters: <>&"'
    success(message)
    await wrapper.vm.$nextTick()

    const toastMessage = wrapper.find('.toast-message')
    expect(toastMessage.text()).toBe(message)
  })

  it('supports custom duration', async () => {
    const wrapper = mount(ToastContainer, {
      global: { stubs: { Teleport: true } }
    })
    const { show, toasts } = useToast()

    show({ message: 'Custom duration', duration: 3000 })
    await wrapper.vm.$nextTick()

    // Toast should be created with custom duration
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].duration).toBe(3000)
  })

  it('removes specific toast when multiple are shown', async () => {
    const wrapper = mount(ToastContainer, {
      global: { stubs: { Teleport: true } }
    })
    const { success, error } = useToast()

    success('First message')
    error('Second message')
    await wrapper.vm.$nextTick()

    const toasts = wrapper.findAll('.toast')
    expect(toasts).toHaveLength(2)

    // Click close on first toast
    await toasts[0].find('.toast-close').trigger('click')
    await wrapper.vm.$nextTick()

    const remainingToasts = wrapper.findAll('.toast')
    expect(remainingToasts).toHaveLength(1)
    expect(remainingToasts[0].classes()).toContain('toast-error')
    expect(remainingToasts[0].text()).toContain('Second message')
  })
})
