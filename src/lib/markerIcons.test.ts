import { describe, test, expect, vi, beforeEach } from 'vitest'
import L from 'leaflet'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

// Mock the dynamicMarkerUtils module
vi.mock('./dynamicMarkerUtils', () => ({
  generateMarkerSvg: vi.fn()
}))

// Import after mocking
const { getCategoryIcon, getDynamicMarkerIcon, iconCache, divIconCache } = await import('./markerIcons')
const dynamicMarkerUtils = await import('./dynamicMarkerUtils')

describe('markerIcons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear the caches between tests
    iconCache.clear()
    divIconCache.clear()
  })

  describe('getCategoryIcon', () => {
    test('creates icon with default slug when null provided', () => {
      const icon = getCategoryIcon(null)

      expect(icon).toBeInstanceOf(L.Icon)
      expect(icon.options.iconUrl).toBe('/icons/categories/andere.png')
      expect(icon.options.iconSize).toEqual([32, 32])
      expect(icon.options.iconAnchor).toEqual([16, 32])
      expect(icon.options.popupAnchor).toEqual([0, -32])
    })

    test('creates icon with specific slug', () => {
      const icon = getCategoryIcon('repair-cafes')

      expect(icon).toBeInstanceOf(L.Icon)
      expect(icon.options.iconUrl).toBe('/icons/categories/repair-cafes.png')
    })

    test('uses iconUrl parameter when provided', () => {
      const customUrl = 'https://example.com/icon.png'
      const icon = getCategoryIcon('repair-cafes', customUrl)

      expect(icon.options.iconUrl).toBe(customUrl)
    })

    test('caches icons by slug', () => {
      const icon1 = getCategoryIcon('repair-cafes')
      const icon2 = getCategoryIcon('repair-cafes')

      // Should return same instance from cache
      expect(icon1).toBe(icon2)
    })

    test('caches icons by iconUrl when provided', () => {
      const customUrl = 'https://example.com/icon.png'
      const icon1 = getCategoryIcon('repair-cafes', customUrl)
      const icon2 = getCategoryIcon('other-slug', customUrl)

      // Should return same instance since iconUrl is the same
      expect(icon1).toBe(icon2)
    })
  })

  describe('getDynamicMarkerIcon', () => {
    const mockCategory: Category = {
      id: 'test-id',
      name_de: 'Test Category',
      name_en: 'Test Category',
      slug: 'test-category',
      icon: null,
      icon_url: null,
      icon_name: 'mdi:recycle',
      color: '#10B981',
      marker_size: 32,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: null,
      description_de: null,
      description_en: null,
      always_open: null
    }

    test('creates DivIcon with SVG content', async () => {
      const mockSvg = '<svg>test</svg>'
      vi.mocked(dynamicMarkerUtils.generateMarkerSvg).mockResolvedValue(mockSvg)

      const icon = await getDynamicMarkerIcon(mockCategory)

      expect(icon).toBeInstanceOf(L.DivIcon)
      expect(icon.options.className).toBe('dynamic-marker')
      expect(icon.options.html).toBe(mockSvg)
      expect(icon.options.iconSize).toEqual([32, 32])
      expect(icon.options.iconAnchor).toEqual([16, 32])
      expect(icon.options.popupAnchor).toEqual([0, -32])
    })

    test('calls generateMarkerSvg with correct config', async () => {
      const mockSvg = '<svg>test</svg>'
      vi.mocked(dynamicMarkerUtils.generateMarkerSvg).mockResolvedValue(mockSvg)

      await getDynamicMarkerIcon(mockCategory)

      expect(dynamicMarkerUtils.generateMarkerSvg).toHaveBeenCalledWith({
        iconName: 'mdi:recycle',
        color: '#10B981',
        size: 32
      })
    })

    test('uses default color when category.color is null', async () => {
      const mockSvg = '<svg>test</svg>'
      vi.mocked(dynamicMarkerUtils.generateMarkerSvg).mockResolvedValue(mockSvg)

      const categoryNoColor: Category = {
        ...mockCategory,
        color: null
      }

      await getDynamicMarkerIcon(categoryNoColor)

      expect(dynamicMarkerUtils.generateMarkerSvg).toHaveBeenCalledWith({
        iconName: 'mdi:recycle',
        color: '#9CA3AF', // Default gray
        size: 32
      })
    })

    test('uses default size when marker_size is null', async () => {
      const mockSvg = '<svg>test</svg>'
      vi.mocked(dynamicMarkerUtils.generateMarkerSvg).mockResolvedValue(mockSvg)

      const categoryNoSize: Category = {
        ...mockCategory,
        marker_size: null
      }

      await getDynamicMarkerIcon(categoryNoSize)

      expect(dynamicMarkerUtils.generateMarkerSvg).toHaveBeenCalledWith({
        iconName: 'mdi:recycle',
        color: '#10B981',
        size: 32
      })
    })

    test('handles different marker sizes', async () => {
      const mockSvg = '<svg>test</svg>'
      vi.mocked(dynamicMarkerUtils.generateMarkerSvg).mockResolvedValue(mockSvg)

      const categoryLarge: Category = {
        ...mockCategory,
        marker_size: 40
      }

      const icon = await getDynamicMarkerIcon(categoryLarge)

      expect(icon.options.iconSize).toEqual([40, 40])
      expect(icon.options.iconAnchor).toEqual([20, 40])
      expect(icon.options.popupAnchor).toEqual([0, -40])
    })

    test('caches DivIcons by unique key', async () => {
      const mockSvg = '<svg>test</svg>'
      vi.mocked(dynamicMarkerUtils.generateMarkerSvg).mockResolvedValue(mockSvg)

      const icon1 = await getDynamicMarkerIcon(mockCategory)
      const icon2 = await getDynamicMarkerIcon(mockCategory)

      // Should only call generateMarkerSvg once due to caching
      expect(dynamicMarkerUtils.generateMarkerSvg).toHaveBeenCalledTimes(1)
      // Should return same instance
      expect(icon1).toBe(icon2)
    })

    test('creates different cache entries for different colors', async () => {
      const mockSvg1 = '<svg>test1</svg>'
      const mockSvg2 = '<svg>test2</svg>'
      vi.mocked(dynamicMarkerUtils.generateMarkerSvg)
        .mockResolvedValueOnce(mockSvg1)
        .mockResolvedValueOnce(mockSvg2)

      const category1 = { ...mockCategory, color: '#10B981' }
      const category2 = { ...mockCategory, color: '#DC2626' }

      const icon1 = await getDynamicMarkerIcon(category1)
      const icon2 = await getDynamicMarkerIcon(category2)

      // Should call generateMarkerSvg twice
      expect(dynamicMarkerUtils.generateMarkerSvg).toHaveBeenCalledTimes(2)
      // Should be different instances
      expect(icon1).not.toBe(icon2)
    })

    test('creates different cache entries for different icon names', async () => {
      const mockSvg1 = '<svg>test1</svg>'
      const mockSvg2 = '<svg>test2</svg>'
      vi.mocked(dynamicMarkerUtils.generateMarkerSvg)
        .mockResolvedValueOnce(mockSvg1)
        .mockResolvedValueOnce(mockSvg2)

      const category1 = { ...mockCategory, icon_name: 'mdi:recycle' }
      const category2 = { ...mockCategory, icon_name: 'mdi:tools' }

      const icon1 = await getDynamicMarkerIcon(category1)
      const icon2 = await getDynamicMarkerIcon(category2)

      // Should call generateMarkerSvg twice
      expect(dynamicMarkerUtils.generateMarkerSvg).toHaveBeenCalledTimes(2)
      // Should be different instances
      expect(icon1).not.toBe(icon2)
    })

    test('creates different cache entries for different sizes', async () => {
      const mockSvg1 = '<svg>test1</svg>'
      const mockSvg2 = '<svg>test2</svg>'
      vi.mocked(dynamicMarkerUtils.generateMarkerSvg)
        .mockResolvedValueOnce(mockSvg1)
        .mockResolvedValueOnce(mockSvg2)

      const category1 = { ...mockCategory, marker_size: 32 }
      const category2 = { ...mockCategory, marker_size: 40 }

      const icon1 = await getDynamicMarkerIcon(category1)
      const icon2 = await getDynamicMarkerIcon(category2)

      // Should call generateMarkerSvg twice
      expect(dynamicMarkerUtils.generateMarkerSvg).toHaveBeenCalledTimes(2)
      // Should be different instances
      expect(icon1).not.toBe(icon2)
    })
  })
})
