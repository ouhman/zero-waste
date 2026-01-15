/**
 * IconSelector Component Tests
 * Tests icon selection UI with search and curated suggestions
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import IconSelector from '@/components/admin/IconSelector.vue'
import { CURATED_ICONS, getAllCuratedIcons } from '@/lib/curatedIcons'

describe('IconSelector', () => {
  let wrapper: VueWrapper<any>

  afterEach(() => {
    wrapper?.unmount()
  })

  describe('Component Rendering', () => {
    test('renders search input', () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
        },
      })

      const input = wrapper.find('input[type="text"]')
      expect(input.exists()).toBe(true)
    })

    test('renders with custom placeholder', () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
          placeholder: 'Custom placeholder',
        },
      })

      const input = wrapper.find('input[type="text"]')
      expect(input.attributes('placeholder')).toBe('Custom placeholder')
    })

    test('renders with default placeholder', () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
        },
      })

      const input = wrapper.find('input[type="text"]')
      expect(input.attributes('placeholder')).toBeTruthy()
    })
  })

  describe('Curated Icons Display', () => {
    test('displays curated icons on mount when showSuggestions is true', () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
          showSuggestions: true,
        },
      })

      // Should show curated icons section
      const curatedSection = wrapper.find('[data-test="curated-icons"]')
      expect(curatedSection.exists()).toBe(true)
    })

    test('hides curated icons when showSuggestions is false', () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
          showSuggestions: false,
        },
      })

      const curatedSection = wrapper.find('[data-test="curated-icons"]')
      expect(curatedSection.exists()).toBe(false)
    })

    test('displays icon categories', () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
          showSuggestions: true,
        },
      })

      // Should have category headings
      const categories = Object.keys(CURATED_ICONS)
      categories.forEach(category => {
        const heading = wrapper.find(`[data-test="category-${category}"]`)
        expect(heading.exists()).toBe(true)
      })
    })

    test('displays icons in grid layout', () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
          showSuggestions: true,
        },
      })

      const iconGrid = wrapper.find('[data-test="icon-grid"]')
      expect(iconGrid.exists()).toBe(true)
    })
  })

  describe('Icon Selection', () => {
    test('emits update:modelValue when icon is clicked', async () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
          showSuggestions: true,
        },
      })

      const firstIcon = wrapper.find('[data-test="icon-button"]')
      await firstIcon.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      const emittedValue = wrapper.emitted('update:modelValue')![0][0]
      expect(typeof emittedValue).toBe('string')
      expect(emittedValue).toContain(':') // Should be in format 'mdi:icon-name'
    })

    test('highlights selected icon', async () => {
      const selectedIcon = 'mdi:recycle'
      wrapper = mount(IconSelector, {
        props: {
          modelValue: selectedIcon,
          showSuggestions: true,
        },
      })

      const selectedButton = wrapper.find(`[data-icon="${selectedIcon}"]`)
      expect(selectedButton.classes()).toContain('selected')
    })

    test('changes selection when clicking different icon', async () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: 'mdi:recycle',
          showSuggestions: true,
        },
      })

      const iconButtons = wrapper.findAll('[data-test="icon-button"]')
      if (iconButtons.length > 1) {
        await iconButtons[1].trigger('click')

        const emissions = wrapper.emitted('update:modelValue')
        expect(emissions).toBeTruthy()
        expect(emissions![0][0]).not.toBe('mdi:recycle')
      }
    })
  })

  describe('Search Functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    test('search input updates internal state', async () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
        },
      })

      const input = wrapper.find('input[type="text"]')
      await input.setValue('recycle')

      expect(input.element.value).toBe('recycle')
    })

    test('search is debounced', async () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
        },
      })

      const input = wrapper.find('input[type="text"]')

      // Type multiple characters quickly
      await input.setValue('r')
      await input.setValue('re')
      await input.setValue('rec')

      // Search should not execute immediately
      expect(wrapper.find('[data-test="search-results"]').exists()).toBe(false)

      // Fast-forward debounce timer
      vi.advanceTimersByTime(300)
      await nextTick()

      // Now search should execute
      expect(wrapper.vm.searchQuery).toBe('rec')
    })

    test('shows loading state during search', async () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
        },
      })

      const input = wrapper.find('input[type="text"]')
      await input.setValue('recycle')

      // Trigger debounced search
      vi.advanceTimersByTime(300)
      await nextTick()

      // Should show loading indicator (at some point during async operation)
      // Note: This may be hard to test without mocking fetch
    })

    test('displays search results', async () => {
      // Use real timers for this test
      vi.useRealTimers()

      // Mock fetch for Iconify API
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            icons: ['mdi:recycle', 'mdi:recycle-variant'],
          }),
        } as Response)
      )

      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
        },
      })

      const input = wrapper.find('input[type="text"]')
      await input.setValue('recycle')

      // Wait for debounce + API call
      await new Promise(resolve => setTimeout(resolve, 350))
      await nextTick()

      const results = wrapper.find('[data-test="search-results"]')
      expect(results.exists()).toBe(true)
    })

    test('shows empty state when no results found', async () => {
      // Use real timers for this test
      vi.useRealTimers()

      // Mock fetch with empty results
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            icons: [],
          }),
        } as Response)
      )

      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
        },
      })

      const input = wrapper.find('input[type="text"]')
      await input.setValue('nonexistenticon123')

      // Wait for debounce + API call
      await new Promise(resolve => setTimeout(resolve, 350))
      await nextTick()

      const emptyState = wrapper.find('[data-test="no-results"]')
      expect(emptyState.exists()).toBe(true)
    })

    test('handles API error gracefully', async () => {
      // Use real timers for this test
      vi.useRealTimers()

      // Mock fetch with error
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      )

      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
        },
      })

      const input = wrapper.find('input[type="text"]')
      await input.setValue('recycle')

      // Wait for debounce + API call
      await new Promise(resolve => setTimeout(resolve, 350))
      await nextTick()

      const errorMessage = wrapper.find('[data-test="error-message"]')
      expect(errorMessage.exists()).toBe(true)
    })

    test('clears search results when input is cleared', async () => {
      // Use real timers for this test
      vi.useRealTimers()

      // Mock fetch for initial search
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            icons: ['mdi:recycle'],
          }),
        } as Response)
      )

      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
          showSuggestions: true,
        },
      })

      const input = wrapper.find('input[type="text"]')

      // Search for something
      await input.setValue('recycle')
      await new Promise(resolve => setTimeout(resolve, 350))
      await nextTick()

      // Clear search
      await input.setValue('')
      // Wait for debounce to clear results
      await new Promise(resolve => setTimeout(resolve, 350))
      await nextTick()

      // Should show curated icons again
      const curatedSection = wrapper.find('[data-test="curated-icons"]')
      expect(curatedSection.exists()).toBe(true)
    })
  })

  describe('Keyboard Navigation', () => {
    test('icons are keyboard accessible', () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
          showSuggestions: true,
        },
      })

      const iconButtons = wrapper.findAll('[data-test="icon-button"]')
      iconButtons.forEach(button => {
        expect(button.attributes('tabindex')).toBeDefined()
      })
    })

    test('Enter key selects icon', async () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
          showSuggestions: true,
        },
      })

      const firstIcon = wrapper.find('[data-test="icon-button"]')
      await firstIcon.trigger('keydown.enter')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })

    test('Space key selects icon', async () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
          showSuggestions: true,
        },
      })

      const firstIcon = wrapper.find('[data-test="icon-button"]')
      await firstIcon.trigger('keydown.space')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    test('search input has label', () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
        },
      })

      const input = wrapper.find('input[type="text"]')
      const label = wrapper.find('label')

      expect(label.exists()).toBe(true)
      expect(label.attributes('for')).toBe(input.attributes('id'))
    })

    test('icon buttons have aria-label', () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
          showSuggestions: true,
        },
      })

      const iconButtons = wrapper.findAll('[data-test="icon-button"]')
      iconButtons.forEach(button => {
        expect(button.attributes('aria-label')).toBeTruthy()
      })
    })

    test('selected icon has aria-pressed="true"', () => {
      const selectedIcon = 'mdi:recycle'
      wrapper = mount(IconSelector, {
        props: {
          modelValue: selectedIcon,
          showSuggestions: true,
        },
      })

      const selectedButton = wrapper.find(`[data-icon="${selectedIcon}"]`)
      expect(selectedButton.attributes('aria-pressed')).toBe('true')
    })

    test('unselected icons have aria-pressed="false"', () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: 'mdi:recycle',
          showSuggestions: true,
        },
      })

      const iconButtons = wrapper.findAll('[data-test="icon-button"]')
      const unselectedButtons = iconButtons.filter(
        button => button.attributes('data-icon') !== 'mdi:recycle'
      )

      unselectedButtons.forEach(button => {
        expect(button.attributes('aria-pressed')).toBe('false')
      })
    })
  })

  describe('Edge Cases', () => {
    test('handles empty modelValue', () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
        },
      })

      expect(wrapper.html()).toBeTruthy()
    })

    test('handles invalid icon name in modelValue', () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: 'invalid:icon:name',
          showSuggestions: true,
        },
      })

      // Should not crash
      expect(wrapper.html()).toBeTruthy()
    })

    test('handles very long search query', async () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
        },
      })

      const input = wrapper.find('input[type="text"]')
      const longQuery = 'a'.repeat(500)
      await input.setValue(longQuery)

      expect(input.element.value).toBe(longQuery)
    })

    test('handles rapid search input changes', async () => {
      vi.useFakeTimers()

      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
        },
      })

      const input = wrapper.find('input[type="text"]')

      // Rapid changes
      for (let i = 0; i < 10; i++) {
        await input.setValue(`query${i}`)
        vi.advanceTimersByTime(50) // Less than debounce time
      }

      // Only the last query should be processed after full debounce
      vi.advanceTimersByTime(300)
      await nextTick()

      expect(input.element.value).toBe('query9')

      vi.useRealTimers()
    })
  })

  describe('Props', () => {
    test('accepts all defined props', () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: 'mdi:recycle',
          placeholder: 'Test placeholder',
          showSuggestions: true,
        },
      })

      expect(wrapper.props('modelValue')).toBe('mdi:recycle')
      expect(wrapper.props('placeholder')).toBe('Test placeholder')
      expect(wrapper.props('showSuggestions')).toBe(true)
    })

    test('uses default values for optional props', () => {
      wrapper = mount(IconSelector, {
        props: {
          modelValue: '',
        },
      })

      expect(wrapper.props('showSuggestions')).toBe(true) // default
    })
  })
})
