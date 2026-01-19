import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isDesktop, isMobile, isBreakpoint } from '../viewport'

describe('viewport utilities', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    // Reset matchMedia mock before each test
    vi.restoreAllMocks()
  })

  afterEach(() => {
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia
  })

  function mockMatchMedia(matches: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  }

  describe('isDesktop', () => {
    it('returns true when viewport is 768px or wider', () => {
      mockMatchMedia(true)
      expect(isDesktop()).toBe(true)
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)')
    })

    it('returns false when viewport is below 768px', () => {
      mockMatchMedia(false)
      expect(isDesktop()).toBe(false)
    })

    it('returns false when matchMedia is not available', () => {
      // @ts-expect-error - intentionally setting to undefined
      window.matchMedia = undefined
      expect(isDesktop()).toBe(false)
    })
  })

  describe('isMobile', () => {
    it('returns true when viewport is below 768px', () => {
      mockMatchMedia(false) // isDesktop returns false
      expect(isMobile()).toBe(true)
    })

    it('returns false when viewport is 768px or wider', () => {
      mockMatchMedia(true) // isDesktop returns true
      expect(isMobile()).toBe(false)
    })

    it('returns true when matchMedia is not available', () => {
      // @ts-expect-error - intentionally setting to undefined
      window.matchMedia = undefined
      expect(isMobile()).toBe(true)
    })
  })

  describe('isBreakpoint', () => {
    it('checks sm breakpoint (640px)', () => {
      mockMatchMedia(true)
      expect(isBreakpoint('sm')).toBe(true)
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 640px)')
    })

    it('checks md breakpoint (768px)', () => {
      mockMatchMedia(true)
      expect(isBreakpoint('md')).toBe(true)
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)')
    })

    it('checks lg breakpoint (1024px)', () => {
      mockMatchMedia(false)
      expect(isBreakpoint('lg')).toBe(false)
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)')
    })

    it('checks xl breakpoint (1280px)', () => {
      mockMatchMedia(true)
      expect(isBreakpoint('xl')).toBe(true)
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1280px)')
    })

    it('checks 2xl breakpoint (1536px)', () => {
      mockMatchMedia(false)
      expect(isBreakpoint('2xl')).toBe(false)
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1536px)')
    })
  })
})
