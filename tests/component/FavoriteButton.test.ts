import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import FavoriteButton from '@/components/FavoriteButton.vue'
import { useFavorites } from '@/composables/useFavorites'

// Mock useFavorites
vi.mock('@/composables/useFavorites', () => ({
  useFavorites: vi.fn()
}))

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      favorites: {
        addToFavorites: 'Add to favorites',
        removeFromFavorites: 'Remove from favorites'
      }
    }
  }
})

describe('FavoriteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders heart icon', () => {
    vi.mocked(useFavorites).mockReturnValue({
      isFavorite: vi.fn(() => false),
      toggleFavorite: vi.fn(),
      favorites: { value: [] },
      addFavorite: vi.fn(),
      removeFavorite: vi.fn()
    } as any)

    const wrapper = mount(FavoriteButton, {
      props: {
        locationId: 'location-1'
      },
      global: {
        plugins: [i18n]
      }
    })

    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('shows filled heart when location is favorited', () => {
    vi.mocked(useFavorites).mockReturnValue({
      isFavorite: vi.fn(() => true),
      toggleFavorite: vi.fn(),
      favorites: { value: ['location-1'] },
      addFavorite: vi.fn(),
      removeFavorite: vi.fn()
    } as any)

    const wrapper = mount(FavoriteButton, {
      props: {
        locationId: 'location-1'
      },
      global: {
        plugins: [i18n]
      }
    })

    const button = wrapper.find('button')
    expect(button.classes()).toContain('favorited')
  })

  it('shows empty heart when location is not favorited', () => {
    vi.mocked(useFavorites).mockReturnValue({
      isFavorite: vi.fn(() => false),
      toggleFavorite: vi.fn(),
      favorites: { value: [] },
      addFavorite: vi.fn(),
      removeFavorite: vi.fn()
    } as any)

    const wrapper = mount(FavoriteButton, {
      props: {
        locationId: 'location-1'
      },
      global: {
        plugins: [i18n]
      }
    })

    const button = wrapper.find('button')
    expect(button.classes()).not.toContain('favorited')
  })

  it('toggles favorite on click', async () => {
    const mockToggle = vi.fn()
    vi.mocked(useFavorites).mockReturnValue({
      isFavorite: vi.fn(() => false),
      toggleFavorite: mockToggle,
      favorites: { value: [] },
      addFavorite: vi.fn(),
      removeFavorite: vi.fn()
    } as any)

    const wrapper = mount(FavoriteButton, {
      props: {
        locationId: 'location-1'
      },
      global: {
        plugins: [i18n]
      }
    })

    await wrapper.find('button').trigger('click')

    expect(mockToggle).toHaveBeenCalledWith('location-1')
  })

  it('displays correct aria-label based on favorite status', () => {
    const mockIsFavorite = vi.fn(() => false)
    vi.mocked(useFavorites).mockReturnValue({
      isFavorite: mockIsFavorite,
      toggleFavorite: vi.fn(),
      favorites: { value: [] },
      addFavorite: vi.fn(),
      removeFavorite: vi.fn()
    } as any)

    const wrapper = mount(FavoriteButton, {
      props: {
        locationId: 'location-1'
      },
      global: {
        plugins: [i18n]
      }
    })

    const button = wrapper.find('button')
    expect(button.attributes('aria-label')).toBeTruthy()
  })
})
