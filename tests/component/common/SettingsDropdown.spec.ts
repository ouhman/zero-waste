import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createI18n } from 'vue-i18n'

// Mock useDarkMode
const mockToggle = vi.fn()
const mockIsDark = ref(false)

vi.mock('@/composables/useDarkMode', () => ({
  useDarkMode: () => ({
    isDark: mockIsDark,
    toggle: mockToggle,
  }),
}))

// Mock setLanguage from i18n plugin
vi.mock('@/plugins/i18n', () => ({
  setLanguage: vi.fn(),
}))

import SettingsDropdown from '@/components/common/SettingsDropdown.vue'
import { setLanguage } from '@/plugins/i18n'

const mockSetLanguage = vi.mocked(setLanguage)

describe('SettingsDropdown', () => {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      en: {
        settings: {
          label: 'Settings',
          language: 'Language',
          appearance: 'Appearance',
        },
      },
      de: {
        settings: {
          label: 'Einstellungen',
          language: 'Sprache',
          appearance: 'Erscheinungsbild',
        },
      },
    },
  })

  beforeEach(() => {
    mockToggle.mockClear()
    mockSetLanguage.mockClear()
    mockIsDark.value = false
    i18n.global.locale.value = 'en'
  })

  describe('Rendering', () => {
    it('renders cog icon button', () => {
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      const button = wrapper.find('button[aria-label="Settings"]')
      expect(button.exists()).toBe(true)
      expect(button.find('svg').exists()).toBe(true)
    })

    it('dropdown is closed by default', () => {
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      const dropdown = wrapper.find('.absolute.right-0.mt-2')
      expect(dropdown.exists()).toBe(false)
    })

    it('opens dropdown on button click', async () => {
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      const button = wrapper.find('button[aria-label="Settings"]')
      await button.trigger('click')

      const dropdown = wrapper.find('.absolute.right-0.mt-2')
      expect(dropdown.exists()).toBe(true)
    })

    it('shows language section with DE/EN buttons', async () => {
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      await wrapper.find('button[aria-label="Settings"]').trigger('click')

      expect(wrapper.text()).toContain('Language')
      expect(wrapper.text()).toContain('🇩🇪 DE')
      expect(wrapper.text()).toContain('🇬🇧 EN')
    })

    it('shows appearance section with toggle', async () => {
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      await wrapper.find('button[aria-label="Settings"]').trigger('click')

      expect(wrapper.text()).toContain('Appearance')
      expect(wrapper.text()).toContain('☀️')
      expect(wrapper.text()).toContain('🌙')

      const toggle = wrapper.find('button[role="switch"]')
      expect(toggle.exists()).toBe(true)
    })
  })

  describe('Language switching', () => {
    it('shows current language (EN) as active', async () => {
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      await wrapper.find('button[aria-label="Settings"]').trigger('click')

      const enButton = wrapper.findAll('button').find(btn => btn.text().includes('🇬🇧 EN'))
      expect(enButton?.classes()).toContain('bg-green-600')
      expect(enButton?.classes()).toContain('text-white')
      expect(enButton?.attributes('aria-pressed')).toBe('true')
    })

    it('shows current language (DE) as active', async () => {
      i18n.global.locale.value = 'de'
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      await wrapper.find('button[aria-label="Einstellungen"]').trigger('click')

      const deButton = wrapper.findAll('button').find(btn => btn.text().includes('🇩🇪 DE'))
      expect(deButton?.classes()).toContain('bg-green-600')
      expect(deButton?.classes()).toContain('text-white')
      expect(deButton?.attributes('aria-pressed')).toBe('true')
    })

    it('calls setLanguage("de") when DE clicked', async () => {
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      await wrapper.find('button[aria-label="Settings"]').trigger('click')

      const deButton = wrapper.findAll('button').find(btn => btn.text().includes('🇩🇪 DE'))
      await deButton?.trigger('click')

      expect(mockSetLanguage).toHaveBeenCalledWith('de')
    })

    it('calls setLanguage("en") when EN clicked', async () => {
      i18n.global.locale.value = 'de'
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      await wrapper.find('button[aria-label="Einstellungen"]').trigger('click')

      const enButton = wrapper.findAll('button').find(btn => btn.text().includes('🇬🇧 EN'))
      await enButton?.trigger('click')

      expect(mockSetLanguage).toHaveBeenCalledWith('en')
    })

    it('closes dropdown after language change', async () => {
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      await wrapper.find('button[aria-label="Settings"]').trigger('click')

      const deButton = wrapper.findAll('button').find(btn => btn.text().includes('🇩🇪 DE'))
      await deButton?.trigger('click')
      await wrapper.vm.$nextTick()

      const dropdown = wrapper.find('.absolute.right-0.mt-2')
      expect(dropdown.exists()).toBe(false)
    })
  })

  describe('Dark mode toggle', () => {
    it('shows correct toggle state when dark mode is off', async () => {
      mockIsDark.value = false
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      await wrapper.find('button[aria-label="Settings"]').trigger('click')

      const toggle = wrapper.find('button[role="switch"]')
      expect(toggle.attributes('aria-checked')).toBe('false')
      expect(toggle.classes()).toContain('bg-gray-300')
    })

    it('shows correct toggle state when dark mode is on', async () => {
      mockIsDark.value = true
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      await wrapper.find('button[aria-label="Settings"]').trigger('click')

      const toggle = wrapper.find('button[role="switch"]')
      expect(toggle.attributes('aria-checked')).toBe('true')
      expect(toggle.classes()).toContain('bg-green-600')
    })

    it('calls toggle() when switch clicked', async () => {
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      await wrapper.find('button[aria-label="Settings"]').trigger('click')

      const toggle = wrapper.find('button[role="switch"]')
      await toggle.trigger('click')

      expect(mockToggle).toHaveBeenCalled()
    })

    it('toggle has role="switch" and aria-checked', async () => {
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      await wrapper.find('button[aria-label="Settings"]').trigger('click')

      const toggle = wrapper.find('button[role="switch"]')
      expect(toggle.attributes('role')).toBe('switch')
      expect(toggle.attributes('aria-checked')).toBeDefined()
      expect(toggle.attributes('aria-label')).toBe('Appearance')
    })
  })

  describe('Dropdown behavior', () => {
    it('closes on ESC key', async () => {
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
        attachTo: document.body,
      })
      await wrapper.find('button[aria-label="Settings"]').trigger('click')

      let dropdown = wrapper.find('.absolute.right-0.mt-2')
      expect(dropdown.exists()).toBe(true)

      // Simulate ESC key press
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(event)
      await wrapper.vm.$nextTick()

      dropdown = wrapper.find('.absolute.right-0.mt-2')
      expect(dropdown.exists()).toBe(false)

      wrapper.unmount()
    })

    it('closes on backdrop click', async () => {
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      await wrapper.find('button[aria-label="Settings"]').trigger('click')

      let dropdown = wrapper.find('.absolute.right-0.mt-2')
      expect(dropdown.exists()).toBe(true)

      const backdrop = wrapper.find('.fixed.inset-0.z-40')
      expect(backdrop.exists()).toBe(true)
      await backdrop.trigger('click')
      await wrapper.vm.$nextTick()

      dropdown = wrapper.find('.absolute.right-0.mt-2')
      expect(dropdown.exists()).toBe(false)
    })

    it('toggles dropdown open and close on trigger button clicks', async () => {
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      const triggerButton = wrapper.find('button[aria-label="Settings"]')

      // Open
      await triggerButton.trigger('click')
      let dropdown = wrapper.find('.absolute.right-0.mt-2')
      expect(dropdown.exists()).toBe(true)

      // Close
      await triggerButton.trigger('click')
      dropdown = wrapper.find('.absolute.right-0.mt-2')
      expect(dropdown.exists()).toBe(false)

      // Open again
      await triggerButton.trigger('click')
      dropdown = wrapper.find('.absolute.right-0.mt-2')
      expect(dropdown.exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('trigger button has aria-label', () => {
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      const button = wrapper.find('button[aria-label="Settings"]')
      expect(button.attributes('aria-label')).toBe('Settings')
    })

    it('trigger has aria-haspopup and aria-expanded', async () => {
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      const button = wrapper.find('button[aria-label="Settings"]')

      expect(button.attributes('aria-haspopup')).toBe('true')
      expect(button.attributes('aria-expanded')).toBe('false')

      await button.trigger('click')
      expect(button.attributes('aria-expanded')).toBe('true')
    })

    it('language buttons have aria-pressed attribute', async () => {
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      await wrapper.find('button[aria-label="Settings"]').trigger('click')

      const deButton = wrapper.findAll('button').find(btn => btn.text().includes('🇩🇪 DE'))
      const enButton = wrapper.findAll('button').find(btn => btn.text().includes('🇬🇧 EN'))

      expect(deButton?.attributes('aria-pressed')).toBeDefined()
      expect(enButton?.attributes('aria-pressed')).toBeDefined()
    })

    it('toggle has role="switch" and aria-checked', async () => {
      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })
      await wrapper.find('button[aria-label="Settings"]').trigger('click')

      const toggle = wrapper.find('button[role="switch"]')
      expect(toggle.attributes('role')).toBe('switch')
      expect(toggle.attributes('aria-checked')).toBeDefined()
    })
  })

  describe('Event listener cleanup', () => {
    it('removes keydown listener on unmount', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const wrapper = mount(SettingsDropdown, {
        global: { plugins: [i18n] },
      })

      wrapper.unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })
  })
})
