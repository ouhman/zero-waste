import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createTestRouter } from '../../utils/test-helpers'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import { h } from 'vue'

// Component that throws an error
const ThrowingComponent = {
  setup() {
    throw new Error('Test error message')
  },
  template: '<div>Should not render</div>'
}

// Component that throws on mounted
const ThrowOnMountComponent = {
  template: '<div>Content</div>',
  mounted() {
    throw new Error('Error on mounted')
  }
}

describe('ErrorBoundary', () => {
  let router: any

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createTestRouter()
  })

  it('renders children when no error', () => {
    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      slots: {
        default: '<div class="child-content">Child content</div>'
      }
    })

    expect(wrapper.find('.child-content').exists()).toBe(true)
    expect(wrapper.find('.error-boundary').exists()).toBe(false)
  })

  it('catches and displays error from child component', async () => {
    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      slots: {
        default: h(ThrowingComponent)
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error-boundary').exists()).toBe(true)
    expect(wrapper.find('.error-title').text()).toBe('Something went wrong')
    expect(wrapper.find('.error-message').exists()).toBe(true)
  })

  it('displays custom title when provided', async () => {
    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      props: {
        title: 'Custom Error Title'
      },
      slots: {
        default: h(ThrowingComponent)
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error-title').text()).toBe('Custom Error Title')
  })

  it('displays error details when showDetails is true', async () => {
    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      props: {
        showDetails: true
      },
      slots: {
        default: h(ThrowingComponent)
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error-details').exists()).toBe(true)
    expect(wrapper.find('.error-details details').exists()).toBe(true)
    expect(wrapper.find('.error-details pre').exists()).toBe(true)
  })

  it('hides error details when showDetails is false', async () => {
    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      props: {
        showDetails: false
      },
      slots: {
        default: h(ThrowingComponent)
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error-details').exists()).toBe(false)
  })

  it('emits error event when error is caught', async () => {
    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      slots: {
        default: h(ThrowingComponent)
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('error')).toBeTruthy()
    const errorEvent = wrapper.emitted('error')![0]
    expect(errorEvent[0]).toBeInstanceOf(Error)
    expect((errorEvent[0] as Error).message).toBe('Test error message')
  })

  it('resets error state when retry button is clicked', async () => {
    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      slots: {
        default: h(ThrowingComponent)
      }
    })

    await wrapper.vm.$nextTick()
    expect(wrapper.find('.error-boundary').exists()).toBe(true)

    const retryButton = wrapper.find('.btn-primary')
    await retryButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('retry')).toBeTruthy()
  })

  it('displays custom retry text when provided', async () => {
    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      props: {
        retryText: 'Reload Page'
      },
      slots: {
        default: h(ThrowingComponent)
      }
    })

    await wrapper.vm.$nextTick()

    const retryButton = wrapper.find('.btn-primary')
    expect(retryButton.text()).toBe('Reload Page')
  })

  it('shows home button when showHome is true', async () => {
    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      props: {
        showHome: true
      },
      slots: {
        default: h(ThrowingComponent)
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.btn-secondary').exists()).toBe(true)
    expect(wrapper.find('.btn-secondary').text()).toBe('Go to Home')
  })

  it('hides home button when showHome is false', async () => {
    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      props: {
        showHome: false
      },
      slots: {
        default: h(ThrowingComponent)
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.btn-secondary').exists()).toBe(false)
  })

  it('navigates to home when home button is clicked', async () => {
    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      props: {
        showHome: true
      },
      slots: {
        default: h(ThrowingComponent)
      }
    })

    await wrapper.vm.$nextTick()

    const homeButton = wrapper.find('.btn-secondary')
    await homeButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(router.currentRoute.value.path).toBe('/')
  })

  it('converts network error to friendly message', async () => {
    const NetworkErrorComponent = {
      setup() {
        throw new Error('Network error: Failed to fetch')
      },
      template: '<div>Content</div>'
    }

    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      slots: {
        default: h(NetworkErrorComponent)
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error-message').text()).toContain(
      'Unable to connect to the server'
    )
  })

  it('converts 404 error to friendly message', async () => {
    const NotFoundComponent = {
      setup() {
        throw new Error('404 Not Found')
      },
      template: '<div>Content</div>'
    }

    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      slots: {
        default: h(NotFoundComponent)
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error-message').text()).toContain(
      'The requested resource was not found'
    )
  })

  it('converts unauthorized error to friendly message', async () => {
    const UnauthorizedComponent = {
      setup() {
        throw new Error('Unauthorized access - 403')
      },
      template: '<div>Content</div>'
    }

    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      slots: {
        default: h(UnauthorizedComponent)
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error-message').text()).toContain(
      'You are not authorized to access this resource'
    )
  })

  it('converts timeout error to friendly message', async () => {
    const TimeoutComponent = {
      setup() {
        throw new Error('Request timeout exceeded')
      },
      template: '<div>Content</div>'
    }

    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      slots: {
        default: h(TimeoutComponent)
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error-message').text()).toContain(
      'The request took too long'
    )
  })

  it('displays generic message for unknown errors', async () => {
    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      slots: {
        default: h(ThrowingComponent)
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error-message').text()).toContain(
      'An unexpected error occurred'
    )
  })

  it('displays error icon', async () => {
    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      slots: {
        default: h(ThrowingComponent)
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error-icon').exists()).toBe(true)
    expect(wrapper.find('.error-icon svg').exists()).toBe(true)
  })

  it('handles nested error boundaries', async () => {
    const InnerErrorBoundary = {
      components: { ErrorBoundary },
      template: `
        <ErrorBoundary>
          <div class="inner-content">Inner content</div>
        </ErrorBoundary>
      `
    }

    const wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      },
      slots: {
        default: h(InnerErrorBoundary)
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.inner-content').exists()).toBe(true)
  })
})
