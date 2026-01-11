import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '@/components/common/EmptyState.vue'
import { h } from 'vue'

// Mock icon component
const MockIcon = {
  template: '<svg class="mock-icon"><path /></svg>'
}

describe('EmptyState', () => {
  it('renders with required title prop', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No items found'
      }
    })

    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('.empty-state-title').text()).toBe('No items found')
  })

  it('displays default icon when no custom icon provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Empty'
      }
    })

    expect(wrapper.find('.empty-state-icon-default').exists()).toBe(true)
    expect(wrapper.find('.empty-state-icon-default svg').exists()).toBe(true)
  })

  it('displays custom icon when provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Empty',
        icon: MockIcon
      }
    })

    expect(wrapper.find('.empty-state-icon').exists()).toBe(true)
    expect(wrapper.find('.mock-icon').exists()).toBe(true)
    expect(wrapper.find('.empty-state-icon-default').exists()).toBe(false)
  })

  it('displays description when provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No results',
        description: 'Try adjusting your search criteria'
      }
    })

    const description = wrapper.find('.empty-state-description')
    expect(description.exists()).toBe(true)
    expect(description.text()).toBe('Try adjusting your search criteria')
  })

  it('does not display description when not provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Empty'
      }
    })

    expect(wrapper.find('.empty-state-description').exists()).toBe(false)
  })

  it('displays action button with actionText prop', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Empty',
        actionText: 'Add New Item'
      }
    })

    const button = wrapper.find('.btn-primary')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Add New Item')
  })

  it('emits action event when action button is clicked', async () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Empty',
        actionText: 'Create'
      }
    })

    const button = wrapper.find('.btn-primary')
    await button.trigger('click')

    expect(wrapper.emitted('action')).toBeTruthy()
    expect(wrapper.emitted('action')).toHaveLength(1)
  })

  it('does not display action button when actionText is not provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Empty'
      }
    })

    expect(wrapper.find('.btn-primary').exists()).toBe(false)
    expect(wrapper.find('.empty-state-action').exists()).toBe(false)
  })

  it('supports custom action slot', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Empty'
      },
      slots: {
        action: '<button class="custom-action">Custom Action</button>'
      }
    })

    expect(wrapper.find('.empty-state-action').exists()).toBe(true)
    expect(wrapper.find('.custom-action').exists()).toBe(true)
    expect(wrapper.find('.custom-action').text()).toBe('Custom Action')
    expect(wrapper.find('.btn-primary').exists()).toBe(false)
  })

  it('prefers custom action slot over actionText prop', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Empty',
        actionText: 'Default Action'
      },
      slots: {
        action: '<button class="custom-action">Slot Action</button>'
      }
    })

    expect(wrapper.find('.custom-action').exists()).toBe(true)
    expect(wrapper.find('.custom-action').text()).toBe('Slot Action')
    // The default button should not be rendered when using slot
    const buttons = wrapper.findAll('.btn-primary')
    expect(buttons).toHaveLength(0)
  })

  it('renders all props together', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No Locations',
        description: 'There are no locations matching your filters',
        actionText: 'Clear Filters',
        icon: MockIcon
      }
    })

    expect(wrapper.find('.empty-state-title').text()).toBe('No Locations')
    expect(wrapper.find('.empty-state-description').text()).toBe(
      'There are no locations matching your filters'
    )
    expect(wrapper.find('.btn-primary').text()).toBe('Clear Filters')
    expect(wrapper.find('.mock-icon').exists()).toBe(true)
  })

  it('has proper layout structure', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Empty',
        description: 'Description',
        actionText: 'Action'
      }
    })

    const emptyState = wrapper.find('.empty-state')
    expect(emptyState.exists()).toBe(true)

    // Should contain icon, title, description, and action in order
    const children = emptyState.element.children
    expect(children.length).toBeGreaterThan(0)

    expect(wrapper.find('.empty-state-icon-default').exists()).toBe(true)
    expect(wrapper.find('.empty-state-title').exists()).toBe(true)
    expect(wrapper.find('.empty-state-description').exists()).toBe(true)
    expect(wrapper.find('.empty-state-action').exists()).toBe(true)
  })

  it('action button is clickable', async () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Empty',
        actionText: 'Click Me'
      }
    })

    const button = wrapper.find('.btn-primary')
    expect(button.attributes('type')).toBe('button')

    await button.trigger('click')
    expect(wrapper.emitted('action')).toBeTruthy()
  })

  it('handles long title text', () => {
    const longTitle = 'This is a very long title that might wrap to multiple lines in the UI'
    const wrapper = mount(EmptyState, {
      props: {
        title: longTitle
      }
    })

    expect(wrapper.find('.empty-state-title').text()).toBe(longTitle)
  })

  it('handles long description text', () => {
    const longDescription = 'This is a very long description with many words that explains in detail what the empty state means and provides helpful guidance to the user about what they should do next.'
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Empty',
        description: longDescription
      }
    })

    expect(wrapper.find('.empty-state-description').text()).toBe(longDescription)
  })

  it('handles special characters in title', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No results for "<search term>" & other symbols'
      }
    })

    expect(wrapper.find('.empty-state-title').text()).toContain('<search term>')
    expect(wrapper.find('.empty-state-title').text()).toContain('&')
  })

  it('handles special characters in description', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Empty',
        description: 'Try searching for "coffee" or "repair" & check filters'
      }
    })

    const description = wrapper.find('.empty-state-description').text()
    expect(description).toContain('"coffee"')
    expect(description).toContain('&')
  })
})
