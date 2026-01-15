import { describe, it, expect, beforeEach, vi } from 'vitest'
import { generateMarkerSvg, getMarkerDataUrl, iconCache } from '@/lib/dynamicMarkerUtils'

// Mock fetch globally
global.fetch = vi.fn()

describe('dynamicMarkerUtils', () => {
  beforeEach(() => {
    // Clear icon cache before each test
    iconCache.clear()

    // Reset fetch mock
    vi.clearAllMocks()

    // Default mock: return a simple SVG
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => '<svg viewBox="0 0 24 24"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/></svg>'
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
      const svg = await generateMarkerSvg({
        iconName: 'unknown:invalid-icon',
        color: '#10B981'
      })

      // Should still generate valid SVG with circle
      expect(svg).toContain('<svg')
      expect(svg).toContain('fill="#10B981"')
    })

    it('caches icon data for performance', async () => {
      // First call should populate cache
      await generateMarkerSvg({
        iconName: 'mdi:recycle',
        color: '#10B981'
      })

      expect(iconCache.size).toBeGreaterThan(0)

      // Second call should use cached data
      const svg = await generateMarkerSvg({
        iconName: 'mdi:recycle',
        color: '#EF4444' // Different color, same icon
      })

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

  describe('iconCache', () => {
    it('starts empty', () => {
      expect(iconCache.size).toBe(0)
    })

    it('can be cleared', async () => {
      await generateMarkerSvg({
        iconName: 'mdi:recycle',
        color: '#10B981'
      })

      expect(iconCache.size).toBeGreaterThan(0)

      iconCache.clear()
      expect(iconCache.size).toBe(0)
    })
  })
})
