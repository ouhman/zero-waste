/**
 * Viewport detection utilities
 * Breakpoints match Tailwind CSS defaults
 */

// Tailwind breakpoints
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

/**
 * Check if current viewport matches a media query
 * Returns false in environments without matchMedia (e.g., JSDOM)
 */
function matchesQuery(query: string): boolean {
  return window.matchMedia?.(query)?.matches ?? false
}

/**
 * Check if viewport is desktop (768px+, matches Tailwind md: breakpoint)
 */
export function isDesktop(): boolean {
  return matchesQuery(`(min-width: ${BREAKPOINTS.md}px)`)
}

/**
 * Check if viewport is mobile (below 768px)
 */
export function isMobile(): boolean {
  return !isDesktop()
}

/**
 * Check if viewport matches a specific Tailwind breakpoint or larger
 */
export function isBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  return matchesQuery(`(min-width: ${BREAKPOINTS[breakpoint]}px)`)
}
