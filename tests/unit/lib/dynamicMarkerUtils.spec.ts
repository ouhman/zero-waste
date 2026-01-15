import { describe, it, expect, beforeEach, vi } from 'vitest'
import { generateMarkerSvg, getMarkerDataUrl, clearIconSvgCache } from '@/lib/dynamicMarkerUtils'

// Mock fetch globally
global.fetch = vi.fn()

// Mock Iconify API JSON response
const mockIconifyResponse = (iconName: string) => {
  const [prefix, name] = iconName.split(':')
  return {
    prefix,
    icons: {
      [name]: {
        body: '<path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>',
        width: 24,
        height: 24
      }
    },
    width: 24,
    height: 24
  }
}

describe('dynamicMarkerUtils', () => {
  beforeEach(() => {
    // Clear icon cache before each test
    clearIconSvgCache()

    // Reset fetch mock
    vi.clearAllMocks()

    // Default mock: return Iconify JSON API response
    ;(global.fetch as any).mockImplementation(async (url: string) => {
      // Extract icon info from URL (e.g., https://api.iconify.design/mdi.json?icons=recycle)
      const urlMatch = url.match(/api\.iconify\.design\/([^.]+)\.json\?icons=(.+)/)
      if (urlMatch) {
        const [, prefix, name] = urlMatch
        return {
          ok: true,
          json: async () => mockIconifyResponse(`${prefix}:${name}`)
        }
      }
      return { ok: false }
    })
  })

  describe('generateMarkerSvg', () => {
    it('generates SVG string with correct structure', async () => {
      const svg = await generateMarkerSvg({
        iconName: 'mdi:recycle',
        color: '#10B981'
      })

      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
      expect(svg).toContain('viewBox="0 0 32 32"')
      expect(svg).toContain('width="32"')
      expect(svg).toContain('height="32"')
    })

    it('includes circle background with correct color', async () => {
      const svg = await generateMarkerSvg({
        iconName: 'mdi:recycle',
        color: '#10B981'
      })

      expect(svg).toContain('fill="#10B981"')
      expect(svg).toContain('<circle')
    })

    it('includes border with default white color', async () => {
      const svg = await generateMarkerSvg({
        iconName: 'mdi:recycle',
        color: '#10B981'
      })

      expect(svg).toContain('stroke="#FFFFFF"')
      expect(svg).toContain('stroke-width="2"')
    })

    it('uses custom border color when provided', async () => {
      const svg = await generateMarkerSvg({
        iconName: 'mdi:recycle',
        color: '#10B981',
        borderColor: '#000000'
      })

      expect(svg).toContain('stroke="#000000"')
    })

    it('uses custom border width when provided', async () => {
      const svg = await generateMarkerSvg({
        iconName: 'mdi:recycle',
        color: '#10B981',
        borderWidth: 3
      })

      expect(svg).toContain('stroke-width="3"')
    })

    it('generates SVG for different sizes', async () => {
      const sizes = [24, 32, 40] as const

      for (const size of sizes) {
        const svg = await generateMarkerSvg({
          iconName: 'mdi:recycle',
          color: '#10B981',
          size
        })

        expect(svg).toContain(`viewBox="0 0 ${size} ${size}"`)
        expect(svg).toContain(`width="${size}"`)
        expect(svg).toContain(`height="${size}"`)
      }
    })

    it('centers circle in viewBox', async () => {
      const svg = await generateMarkerSvg({
        iconName: 'mdi:recycle',
        color: '#10B981',
        size: 32
      })

      expect(svg).toContain('cx="16"')
      expect(svg).toContain('cy="16"')
    })

    it('calculates correct circle radius', async () => {
      const svg = await generateMarkerSvg({
        iconName: 'mdi:recycle',
        color: '#10B981',
        size: 32,
        borderWidth: 2
      })

      // Radius = (32 / 2) - 2 = 14
      expect(svg).toContain('r="14"')
    })

    it('returns fallback SVG for unknown icon', async () => {
      // Mock failed fetch for unknown icon
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      const svg = await generateMarkerSvg({
        iconName: 'unknown:invalid-icon',
        color: '#10B981'
      })

      // Should still generate valid SVG with circle (just no icon inside)
      expect(svg).toContain('<svg')
      expect(svg).toContain('fill="#10B981"')
      expect(svg).toContain('<circle')
    })

    it('caches icon data for performance', async () => {
      // First call should fetch from API
      await generateMarkerSvg({
        iconName: 'mdi:recycle',
        color: '#10B981'
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Second call should use cached data (no additional fetch)
      const svg = await generateMarkerSvg({
        iconName: 'mdi:recycle',
        color: '#EF4444' // Different color, same icon
      })

      expect(global.fetch).toHaveBeenCalledTimes(1) // Still only 1 call
      expect(svg).toContain('fill="#EF4444"')
    })

    it('handles different icon collections', async () => {
      const icons = [
        'mdi:recycle',
        'lucide:store',
        'tabler:leaf',
        'heroicons:shopping-bag'
      ]

      for (const iconName of icons) {
        const svg = await generateMarkerSvg({
          iconName,
          color: '#10B981'
        })

        expect(svg).toContain('<svg')
        expect(svg).toContain('</svg>')
      }
    })
  })

  describe('getMarkerDataUrl', () => {
    it('generates data URL from SVG string', async () => {
      const dataUrl = await getMarkerDataUrl({
        iconName: 'mdi:recycle',
        color: '#10B981'
      })

      expect(dataUrl).toMatch(/^data:image\/svg\+xml/)
    })

    it('generates valid base64 encoded data URL', async () => {
      const dataUrl = await getMarkerDataUrl({
        iconName: 'mdi:recycle',
        color: '#10B981'
      })

      expect(dataUrl).toContain('base64,')
    })

    it('generates different URLs for different configs', async () => {
      const url1 = await getMarkerDataUrl({
        iconName: 'mdi:recycle',
        color: '#10B981'
      })

      const url2 = await getMarkerDataUrl({
        iconName: 'mdi:recycle',
        color: '#EF4444'
      })

      expect(url1).not.toBe(url2)
    })

    it('generates URL for all size variants', async () => {
      const sizes = [24, 32, 40] as const

      for (const size of sizes) {
        const dataUrl = await getMarkerDataUrl({
          iconName: 'mdi:recycle',
          color: '#10B981',
          size
        })

        expect(dataUrl).toMatch(/^data:image\/svg\+xml;base64,/)
      }
    })
  })

  describe('clearIconSvgCache', () => {
    it('clears cached icon data', async () => {
      // First call should fetch from API
      await generateMarkerSvg({
        iconName: 'mdi:recycle',
        color: '#10B981'
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Second call uses cache
      await generateMarkerSvg({
        iconName: 'mdi:recycle',
        color: '#10B981'
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Clear cache
      clearIconSvgCache()

      // Third call should fetch again since cache was cleared
      await generateMarkerSvg({
        iconName: 'mdi:recycle',
        color: '#10B981'
      })

      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })
})
