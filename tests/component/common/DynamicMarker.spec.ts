import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DynamicMarker from '@/components/common/DynamicMarker.vue'

// Mock @iconify/vue
vi.mock('@iconify/vue', () => ({
  Icon: {
    name: 'Icon',
    template: '<svg data-testid="iconify-icon"><path /></svg>',
    props: ['icon', 'width', 'height']
  }
}))

describe('DynamicMarker', () => {
  it('renders with default props', () => {
    const wrapper = mount(DynamicMarker, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981'
      }
    })

    expect(wrapper.find('.dynamic-marker').exists()).toBe(true)
  })

  it('renders SVG with correct viewBox', () => {
    const wrapper = mount(DynamicMarker, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981'
      }
    })

    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('viewBox')).toBe('0 0 32 32')
  })

  it('uses size prop for SVG dimensions', () => {
    const wrapper = mount(DynamicMarker, {
      props: {
        iconName: 'mdi:store',
        color: '#3B82F6',
        size: 40
      }
    })

    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('40')
    expect(svg.attributes('height')).toBe('40')
    expect(svg.attributes('viewBox')).toBe('0 0 40 40')
  })

  it('renders small size marker (24px)', () => {
    const wrapper = mount(DynamicMarker, {
      props: {
        iconName: 'mdi:leaf',
        color: '#10B981',
        size: 24
      }
    })

    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('24')
    expect(svg.attributes('height')).toBe('24')
    expect(svg.attributes('viewBox')).toBe('0 0 24 24')
  })

  it('renders large size marker (40px)', () => {
    const wrapper = mount(DynamicMarker, {
      props: {
        iconName: 'lucide:shopping-bag',
        color: '#EF4444',
        size: 40
      }
    })

    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('40')
    expect(svg.attributes('height')).toBe('40')
  })

  it('renders circle background with correct fill color', () => {
    const wrapper = mount(DynamicMarker, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981'
      }
    })

    const circle = wrapper.find('circle')
    expect(circle.exists()).toBe(true)
    expect(circle.attributes('fill')).toBe('#10B981')
  })

  it('uses custom color prop', () => {
    const wrapper = mount(DynamicMarker, {
      props: {
        iconName: 'mdi:store',
        color: '#FF5733'
      }
    })

    const circle = wrapper.find('circle')
    expect(circle.attributes('fill')).toBe('#FF5733')
  })

  it('renders circle with default white border', () => {
    const wrapper = mount(DynamicMarker, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981'
      }
    })

    const circle = wrapper.find('circle')
    expect(circle.attributes('stroke')).toBe('#FFFFFF')
    expect(circle.attributes('stroke-width')).toBe('2')
  })

  it('uses custom border color', () => {
    const wrapper = mount(DynamicMarker, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981',
        borderColor: '#000000'
      }
    })

    const circle = wrapper.find('circle')
    expect(circle.attributes('stroke')).toBe('#000000')
  })

  it('uses custom border width', () => {
    const wrapper = mount(DynamicMarker, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981',
        borderWidth: 3
      }
    })

    const circle = wrapper.find('circle')
    expect(circle.attributes('stroke-width')).toBe('3')
  })

  it('centers circle in SVG viewBox', () => {
    const wrapper = mount(DynamicMarker, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981',
        size: 32
      }
    })

    const circle = wrapper.find('circle')
    expect(circle.attributes('cx')).toBe('16')
    expect(circle.attributes('cy')).toBe('16')
  })

  it('renders Iconify icon component', () => {
    const wrapper = mount(DynamicMarker, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981'
      }
    })

    const icon = wrapper.findComponent({ name: 'Icon' })
    expect(icon.exists()).toBe(true)
    expect(icon.props('icon')).toBe('mdi:recycle')
  })

  it('sets correct icon width/height', () => {
    const wrapper = mount(DynamicMarker, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981',
        size: 32
      }
    })

    const icon = wrapper.findComponent({ name: 'Icon' })
    // Icon should be 60% of marker size for good proportion
    expect(icon.props('width')).toBe(19) // 60% of 32 = 19.2 rounded down
    expect(icon.props('height')).toBe(19)
  })

  it('handles different icon names', () => {
    const iconNames = ['mdi:recycle', 'lucide:store', 'tabler:leaf', 'heroicons:shopping-bag']

    iconNames.forEach(iconName => {
      const wrapper = mount(DynamicMarker, {
        props: {
          iconName,
          color: '#10B981'
        }
      })

      const icon = wrapper.findComponent({ name: 'Icon' })
      expect(icon.props('icon')).toBe(iconName)
    })
  })

  it('has accessible ARIA label', () => {
    const wrapper = mount(DynamicMarker, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981'
      }
    })

    const svg = wrapper.find('svg')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('Location marker')
  })

  it('supports all props combined', () => {
    const wrapper = mount(DynamicMarker, {
      props: {
        iconName: 'lucide:shopping-cart',
        color: '#EF4444',
        size: 40,
        borderWidth: 3,
        borderColor: '#000000'
      }
    })

    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('40')
    expect(svg.attributes('height')).toBe('40')

    const circle = wrapper.find('circle')
    expect(circle.attributes('fill')).toBe('#EF4444')
    expect(circle.attributes('stroke')).toBe('#000000')
    expect(circle.attributes('stroke-width')).toBe('3')

    const icon = wrapper.findComponent({ name: 'Icon' })
    expect(icon.props('icon')).toBe('lucide:shopping-cart')
  })

  it('computes circle radius based on size and border width', () => {
    const wrapper = mount(DynamicMarker, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981',
        size: 32,
        borderWidth: 2
      }
    })

    const circle = wrapper.find('circle')
    // Radius = (size / 2) - borderWidth = 16 - 2 = 14
    expect(circle.attributes('r')).toBe('14')
  })

  it('adjusts radius with larger border width', () => {
    const wrapper = mount(DynamicMarker, {
      props: {
        iconName: 'mdi:recycle',
        color: '#10B981',
        size: 40,
        borderWidth: 4
      }
    })

    const circle = wrapper.find('circle')
    // Radius = (size / 2) - borderWidth = 20 - 4 = 16
    expect(circle.attributes('r')).toBe('16')
  })
})
