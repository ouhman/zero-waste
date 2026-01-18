import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import BetaModal from '@/components/BetaModal.vue'
import { createTestI18n } from '../utils/test-helpers'

// Mock the useFeedback composable
vi.mock('@/composables/useFeedback', () => ({
  useFeedback: vi.fn()
}))

import { useFeedback } from '@/composables/useFeedback'

// Helper to click the feedback toggle button to show the form
async function showFeedbackForm(wrapper: ReturnType<typeof mount>) {
  const toggleButton = wrapper.findAll('button').find(btn =>
    btn.text().includes('Sometimes')
  )
  if (toggleButton) {
    await toggleButton.trigger('click')
    await wrapper.vm.$nextTick()
  }
}

describe('BetaModal', () => {
  let i18n: ReturnType<typeof createTestI18n>
  let mockUseFeedback: any

  beforeEach(() => {
    i18n = createTestI18n()

    // Setup default mock implementation
    mockUseFeedback = {
      error: { value: null },
      rateLimitExceeded: { value: false },
      rateLimitRemaining: { value: 0 },
      submitFeedback: vi.fn().mockResolvedValue({ success: true }),
      checkRateLimit: vi.fn().mockReturnValue(false)
    }

    vi.mocked(useFeedback).mockReturnValue(mockUseFeedback)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Visibility and Rendering', () => {
    test('renders when isOpen is true', () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      expect(wrapper.find('.bg-white.dark\\:bg-gray-800').exists()).toBe(true)
      expect(wrapper.text()).toContain('Welcome, fellow zero waste adventurer')
    })

    test('does not render when isOpen is false', () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: false
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      expect(wrapper.find('.bg-white.dark\\:bg-gray-800').exists()).toBe(false)
    })

    test('displays all content sections', () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      // Check for main sections
      expect(wrapper.text()).toContain('Welcome, fellow zero waste adventurer')
      expect(wrapper.text()).toContain('What is this?')
      expect(wrapper.text()).toContain('Why we\'re building this')
      expect(wrapper.text()).toContain('Every small step matters. Even the tiny ones.')
      expect(wrapper.text()).toContain('Sometimes it\'s OK to say something nice too! ;)')
    })
  })

  describe('Modal Behavior', () => {
    test('emits close event when close button is clicked', async () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      const closeButton = wrapper.find('button[aria-label="Close"]')
      await closeButton.trigger('click')

      expect(wrapper.emitted()).toHaveProperty('close')
    })

    test('emits close event when backdrop is clicked', async () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      // Find backdrop (first fixed element)
      const backdrop = wrapper.find('.fixed.inset-0.bg-black\\/50')
      await backdrop.trigger('click')

      expect(wrapper.emitted()).toHaveProperty('close')
    })

    test('closes on ESC key press', async () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      // Simulate ESC key press
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted()).toHaveProperty('close')
    })

    test('does not close on ESC when modal is not open', async () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: false
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      // Simulate ESC key press
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('close')).toBeFalsy()
    })
  })

  describe('Form Validation', () => {
    test('message field is initially empty', async () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await showFeedbackForm(wrapper)
      const messageField = wrapper.find('#beta-message').element as HTMLTextAreaElement
      expect(messageField.value).toBe('')
    })

    test('shows validation error when message is too short', async () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await showFeedbackForm(wrapper)
      const messageField = wrapper.find('#beta-message')
      await messageField.setValue('short')

      const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('Send'))
      await submitButton?.trigger('click')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Message must be at least 10 characters long')
      expect(mockUseFeedback.submitFeedback).not.toHaveBeenCalled()
    })

    test('shows validation error when message is empty', async () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await showFeedbackForm(wrapper)
      const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('Send'))
      await submitButton?.trigger('click')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Message must be at least 10 characters long')
      expect(mockUseFeedback.submitFeedback).not.toHaveBeenCalled()
    })

    test('accepts valid message (10+ characters)', async () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await showFeedbackForm(wrapper)
      const messageField = wrapper.find('#beta-message')
      await messageField.setValue('This is a valid message with more than 10 characters')

      const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('Send'))
      await submitButton?.trigger('click')

      await flushPromises()

      expect(mockUseFeedback.submitFeedback).toHaveBeenCalled()
    })

    test('email field is optional', async () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await showFeedbackForm(wrapper)
      const messageField = wrapper.find('#beta-message')
      await messageField.setValue('Valid message without email')

      const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('Send'))
      await submitButton?.trigger('click')

      await flushPromises()

      expect(mockUseFeedback.submitFeedback).toHaveBeenCalledWith(
        'Valid message without email',
        undefined
      )
    })

    test('includes email when provided', async () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await showFeedbackForm(wrapper)
      const messageField = wrapper.find('#beta-message')
      const emailField = wrapper.find('#beta-email')

      await messageField.setValue('Valid message with email')
      await emailField.setValue('test@example.com')

      const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('Send'))
      await submitButton?.trigger('click')

      await flushPromises()

      expect(mockUseFeedback.submitFeedback).toHaveBeenCalledWith(
        'Valid message with email',
        'test@example.com'
      )
    })
  })

  describe('Submission States', () => {
    test('shows loading state during submission', async () => {
      // Make submitFeedback take some time
      mockUseFeedback.submitFeedback.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      )

      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await showFeedbackForm(wrapper)
      const messageField = wrapper.find('#beta-message')
      await messageField.setValue('Valid message for loading test')

      const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('Send'))
      await submitButton?.trigger('click')

      await wrapper.vm.$nextTick()

      // Should show loading state
      expect(wrapper.text()).toContain('Loading')
      expect(submitButton?.attributes('disabled')).toBeDefined()
    })

    test('shows success state after successful submission', async () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await showFeedbackForm(wrapper)
      const messageField = wrapper.find('#beta-message')
      await messageField.setValue('Valid message for success test')

      const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('Send'))
      await submitButton?.trigger('click')

      await flushPromises()

      // Should show success state
      expect(wrapper.text()).toContain('Thanks for being here.')
      expect(wrapper.text()).toContain('Your feedback has been sent')

      // Check for success icon (checkmark SVG)
      const successIcon = wrapper.find('.bg-green-100')
      expect(successIcon.exists()).toBe(true)
    })

    test('resets form after successful submission', async () => {
      // Mount with isOpen: false first
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: false
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      // Open modal
      await wrapper.setProps({ isOpen: true })
      await wrapper.vm.$nextTick()

      await showFeedbackForm(wrapper)
      const messageField = wrapper.find('#beta-message')
      const emailField = wrapper.find('#beta-email')

      await messageField.setValue('Valid message for reset test')
      await emailField.setValue('test@example.com')

      const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('Send'))
      await submitButton?.trigger('click')

      await flushPromises()

      // Should show success state
      expect(wrapper.text()).toContain('Thanks for being here.')

      // Close modal
      await wrapper.setProps({ isOpen: false })
      await wrapper.vm.$nextTick()

      // Re-open modal - form should be reset to default state
      await wrapper.setProps({ isOpen: true })
      await wrapper.vm.$nextTick()

      // Show form and check that form fields are now empty
      await showFeedbackForm(wrapper)
      const newMessageField = wrapper.find('#beta-message')
      const newEmailField = wrapper.find('#beta-email')

      expect((newMessageField.element as HTMLTextAreaElement).value).toBe('')
      expect((newEmailField.element as HTMLInputElement).value).toBe('')
    })

    test('close button works in success state', async () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await showFeedbackForm(wrapper)
      const messageField = wrapper.find('#beta-message')
      await messageField.setValue('Valid message for close test')

      const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('Send'))
      await submitButton?.trigger('click')

      await flushPromises()

      // Find close button in success state
      const closeButton = wrapper.findAll('button').find(btn => btn.text() === 'Close')
      await closeButton?.trigger('click')

      expect(wrapper.emitted()).toHaveProperty('close')
    })
  })

  describe('Rate Limiting', () => {
    test('shows rate limited state when opening modal if rate limited', async () => {
      mockUseFeedback.checkRateLimit.mockReturnValue(true)
      mockUseFeedback.rateLimitRemaining.value = 120

      // Mount with isOpen: false first to trigger the watcher
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: false
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      // Now set isOpen to true to trigger the watcher
      await wrapper.setProps({ isOpen: true })
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Slow down there!')
      expect(wrapper.text()).toContain('120s')

      // Check for rate limit icon (clock SVG)
      const rateLimitIcon = wrapper.find('.bg-yellow-100')
      expect(rateLimitIcon.exists()).toBe(true)
    })

    test('shows rate limited state after submission if server returns 429', async () => {
      mockUseFeedback.submitFeedback.mockResolvedValue({ success: false })
      mockUseFeedback.rateLimitExceeded.value = true
      mockUseFeedback.rateLimitRemaining.value = 60

      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await showFeedbackForm(wrapper)
      const messageField = wrapper.find('#beta-message')
      await messageField.setValue('Valid message for rate limit test')

      const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('Send'))
      await submitButton?.trigger('click')

      await flushPromises()

      expect(wrapper.text()).toContain('Slow down there!')
    })

    test('countdown timer decrements remaining time', async () => {
      vi.useFakeTimers()

      mockUseFeedback.checkRateLimit.mockReturnValue(true)
      mockUseFeedback.rateLimitRemaining.value = 5

      // Mount with isOpen: false first to trigger the watcher
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: false
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      // Now set isOpen to true to trigger the watcher
      await wrapper.setProps({ isOpen: true })
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('5s')

      // Advance timer by 1 second
      vi.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('4s')

      vi.useRealTimers()
    })

    test('switches back to default state when countdown reaches zero', async () => {
      vi.useFakeTimers()

      mockUseFeedback.checkRateLimit.mockReturnValue(true)
      mockUseFeedback.rateLimitRemaining.value = 2

      // Mount with isOpen: false first to trigger the watcher
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: false
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      // Now set isOpen to true to trigger the watcher
      await wrapper.setProps({ isOpen: true })
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Slow down there!')

      // Advance timer past countdown
      vi.advanceTimersByTime(3000)
      await wrapper.vm.$nextTick()

      // Should now show toggle button (form hidden by default)
      expect(wrapper.text()).toContain('Sometimes')
      // Form should not be visible until toggle is clicked
      expect(wrapper.find('#beta-message').exists()).toBe(false)

      vi.useRealTimers()
    })

    test('close button works in rate limited state', async () => {
      mockUseFeedback.checkRateLimit.mockReturnValue(true)
      mockUseFeedback.rateLimitRemaining.value = 120

      // Mount with isOpen: false first to trigger the watcher
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: false
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      // Now set isOpen to true to trigger the watcher
      await wrapper.setProps({ isOpen: true })
      await wrapper.vm.$nextTick()

      const closeButton = wrapper.findAll('button').find(btn => btn.text() === 'Close')
      await closeButton?.trigger('click')

      expect(wrapper.emitted()).toHaveProperty('close')
    })

    test('cleans up countdown interval on unmount', async () => {
      vi.useFakeTimers()

      mockUseFeedback.checkRateLimit.mockReturnValue(true)
      mockUseFeedback.rateLimitRemaining.value = 120

      // Mount with isOpen: false first to trigger the watcher
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: false
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      // Now set isOpen to true to trigger the watcher
      await wrapper.setProps({ isOpen: true })
      await wrapper.vm.$nextTick()

      // Unmount component
      wrapper.unmount()

      // Advancing timers should not cause any issues
      expect(() => {
        vi.advanceTimersByTime(5000)
      }).not.toThrow()

      vi.useRealTimers()
    })
  })

  describe('Submit Button State', () => {
    test('submit button is enabled when form is valid', async () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await showFeedbackForm(wrapper)
      const messageField = wrapper.find('#beta-message')
      await messageField.setValue('Valid message with enough characters')

      await wrapper.vm.$nextTick()

      const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('Send'))
      expect(submitButton?.attributes('disabled')).toBeUndefined()
    })

    test('submit button is disabled during submission', async () => {
      mockUseFeedback.submitFeedback.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      )

      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await showFeedbackForm(wrapper)
      const messageField = wrapper.find('#beta-message')
      await messageField.setValue('Valid message for disabled test')

      const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('Send'))
      await submitButton?.trigger('click')

      await wrapper.vm.$nextTick()

      expect(submitButton?.attributes('disabled')).toBeDefined()
    })
  })

  describe('Form Display State', () => {
    test('form is hidden by default, toggle button is visible', () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      // Form should be hidden by default
      expect(wrapper.find('#beta-message').exists()).toBe(false)
      expect(wrapper.find('#beta-email').exists()).toBe(false)
      // Toggle button should be visible
      expect(wrapper.text()).toContain('Sometimes')
    })

    test('form is visible after clicking toggle button', async () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await showFeedbackForm(wrapper)
      expect(wrapper.find('#beta-message').exists()).toBe(true)
      expect(wrapper.find('#beta-email').exists()).toBe(true)
    })

    test('form is visible in submitting state', async () => {
      mockUseFeedback.submitFeedback.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      )

      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await showFeedbackForm(wrapper)
      const messageField = wrapper.find('#beta-message')
      await messageField.setValue('Valid message')

      const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('Send'))
      await submitButton?.trigger('click')

      await wrapper.vm.$nextTick()

      expect(wrapper.find('#beta-message').exists()).toBe(true)
    })

    test('form is hidden in success state', async () => {
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await showFeedbackForm(wrapper)
      const messageField = wrapper.find('#beta-message')
      await messageField.setValue('Valid message')

      const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('Send'))
      await submitButton?.trigger('click')

      await flushPromises()

      expect(wrapper.find('#beta-message').exists()).toBe(false)
    })

    test('form is hidden in rate limited state', async () => {
      mockUseFeedback.checkRateLimit.mockReturnValue(true)
      mockUseFeedback.rateLimitRemaining.value = 120

      // Mount with isOpen: false first to trigger the watcher
      const wrapper = mount(BetaModal, {
        props: {
          isOpen: false
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      // Now set isOpen to true to trigger the watcher
      await wrapper.setProps({ isOpen: true })
      await wrapper.vm.$nextTick()

      expect(wrapper.find('#beta-message').exists()).toBe(false)
    })
  })

  describe('Error Handling', () => {
    test('stays in default state when submission fails (non-rate-limit)', async () => {
      mockUseFeedback.submitFeedback.mockResolvedValue({ success: false })
      mockUseFeedback.rateLimitExceeded.value = false
      mockUseFeedback.error.value = 'Network error'

      const wrapper = mount(BetaModal, {
        props: {
          isOpen: true
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await showFeedbackForm(wrapper)
      const messageField = wrapper.find('#beta-message')
      await messageField.setValue('Valid message')

      const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('Send'))
      await submitButton?.trigger('click')

      await flushPromises()

      // Should stay in default state (form still visible)
      expect(wrapper.find('#beta-message').exists()).toBe(true)
    })
  })
})
