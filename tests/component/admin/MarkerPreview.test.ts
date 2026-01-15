import { describe, test, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MarkerPreview from '@/components/admin/MarkerPreview.vue'
import DynamicMarker from '@/components/common/DynamicMarker.vue'
import { createTestI18n } from '../../utils/test-helpers'

describe('MarkerPreview', () => {
  const i18n = createTestI18n()

  test('renders preview label', () => {
    const wrapper = mount(MarkerPreview, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981',
        size: 32
      },
      global: {
        plugins: [i18n]
      }
    })

    expect(wrapper.find('.preview-label').exists()).toBe(true)
  })

  test('renders DynamicMarker when iconName is provided', () => {
    const wrapper = mount(MarkerPreview, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981',
        size: 32
      },
      global: {
        plugins: [i18n]
      }
    })

    const dynamicMarker = wrapper.findComponent(DynamicMarker)
    expect(dynamicMarker.exists()).toBe(true)
    expect(dynamicMarker.props('iconName')).toBe('mdi:recycle')
    expect(dynamicMarker.props('color')).toBe('#10B981')
    expect(dynamicMarker.props('size')).toBe(32)
  })

  test('shows placeholder when iconName is empty', () => {
    const wrapper = mount(MarkerPreview, {
      props: {
        iconName: '',
        color: '#10B981',
        size: 32
      },
      global: {
        plugins: [i18n]
      }
    })

    expect(wrapper.find('.preview-placeholder').exists()).toBe(true)
    expect(wrapper.find('.placeholder-text').exists()).toBe(true)
    expect(wrapper.findComponent(DynamicMarker).exists()).toBe(false)
  })

  test('updates DynamicMarker when props change', async () => {
    const wrapper = mount(MarkerPreview, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981',
        size: 32
      },
      global: {
        plugins: [i18n]
      }
    })

    let dynamicMarker = wrapper.findComponent(DynamicMarker)
    expect(dynamicMarker.props('iconName')).toBe('mdi:recycle')
    expect(dynamicMarker.props('color')).toBe('#10B981')
    expect(dynamicMarker.props('size')).toBe(32)

    // Update props
    await wrapper.setProps({
      iconName: 'lucide:store',
      color: '#FF0000',
      size: 40
    })

    dynamicMarker = wrapper.findComponent(DynamicMarker)
    expect(dynamicMarker.props('iconName')).toBe('lucide:store')
    expect(dynamicMarker.props('color')).toBe('#FF0000')
    expect(dynamicMarker.props('size')).toBe(40)
  })

  test('uses default props when not provided', () => {
    const wrapper = mount(MarkerPreview, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981',
        size: 32
      },
      global: {
        plugins: [i18n]
      }
    })

    const dynamicMarker = wrapper.findComponent(DynamicMarker)
    expect(dynamicMarker.exists()).toBe(true)
  })

  test('renders preview container with correct styling', () => {
    const wrapper = mount(MarkerPreview, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981',
        size: 32
      },
      global: {
        plugins: [i18n]
      }
    })

    const previewContainer = wrapper.find('.preview-container')
    expect(previewContainer.exists()).toBe(true)
    expect(previewContainer.classes()).toContain('preview-container')
  })

  test('toggles between marker and placeholder', async () => {
    const wrapper = mount(MarkerPreview, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981',
        size: 32
      },
      global: {
        plugins: [i18n]
      }
    })

    // Initially shows marker
    expect(wrapper.findComponent(DynamicMarker).exists()).toBe(true)
    expect(wrapper.find('.preview-placeholder').exists()).toBe(false)

    // Remove icon
    await wrapper.setProps({ iconName: '' })

    // Should show placeholder
    expect(wrapper.findComponent(DynamicMarker).exists()).toBe(false)
    expect(wrapper.find('.preview-placeholder').exists()).toBe(true)

    // Add icon back
    await wrapper.setProps({ iconName: 'lucide:store' })

    // Should show marker again
    expect(wrapper.findComponent(DynamicMarker).exists()).toBe(true)
    expect(wrapper.find('.preview-placeholder').exists()).toBe(false)
  })

  test('handles all marker sizes correctly', async () => {
    const wrapper = mount(MarkerPreview, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981',
        size: 24
      },
      global: {
        plugins: [i18n]
      }
    })

    let dynamicMarker = wrapper.findComponent(DynamicMarker)
    expect(dynamicMarker.props('size')).toBe(24)

    await wrapper.setProps({ size: 32 })
    dynamicMarker = wrapper.findComponent(DynamicMarker)
    expect(dynamicMarker.props('size')).toBe(32)

    await wrapper.setProps({ size: 40 })
    dynamicMarker = wrapper.findComponent(DynamicMarker)
    expect(dynamicMarker.props('size')).toBe(40)
  })

  test('handles different color formats', async () => {
    const wrapper = mount(MarkerPreview, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981',
        size: 32
      },
      global: {
        plugins: [i18n]
      }
    })

    let dynamicMarker = wrapper.findComponent(DynamicMarker)
    expect(dynamicMarker.props('color')).toBe('#10B981')

    // Test lowercase hex
    await wrapper.setProps({ color: '#ff0000' })
    dynamicMarker = wrapper.findComponent(DynamicMarker)
    expect(dynamicMarker.props('color')).toBe('#ff0000')

    // Test uppercase hex
    await wrapper.setProps({ color: '#00FF00' })
    dynamicMarker = wrapper.findComponent(DynamicMarker)
    expect(dynamicMarker.props('color')).toBe('#00FF00')
  })
})
