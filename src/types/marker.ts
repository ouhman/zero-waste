/**
 * Marker-related types for dynamic SVG markers
 * Part of Dynamic Markers implementation
 * See: ai/plans/2026-01-15-dynamic-markers.md
 */

/**
 * Marker size options
 * Small: 24px, Medium: 32px (default), Large: 40px
 */
export type MarkerSize = 24 | 32 | 40

/**
 * Marker size label mapping
 */
export const MARKER_SIZE_LABELS: Record<MarkerSize, string> = {
  24: 'Small',
  32: 'Medium',
  40: 'Large'
}

/**
 * Configuration for dynamic marker rendering
 */
export interface MarkerConfig {
  /**
   * Iconify icon identifier (e.g., 'mdi:recycle', 'lucide:store')
   */
  iconName: string

  /**
   * Background color (hex format, e.g., '#10B981')
   */
  color: string

  /**
   * Marker size in pixels (default: 32)
   */
  size?: MarkerSize

  /**
   * Border width in pixels (default: 2)
   */
  borderWidth?: number

  /**
   * Border color (hex format, default: '#FFFFFF')
   */
  borderColor?: string

  /**
   * Icon color (hex format, default: '#FFFFFF' for white)
   */
  iconColor?: string
}

/**
 * Default marker configuration values
 */
export const DEFAULT_MARKER_CONFIG: Required<Omit<MarkerConfig, 'iconName' | 'color'>> = {
  size: 32,
  borderWidth: 2,
  borderColor: '#FFFFFF',
  iconColor: '#FFFFFF'
}

/**
 * Result of marker icon generation
 */
export interface MarkerIconData {
  /**
   * SVG string for rendering
   */
  svg: string

  /**
   * Data URL for Leaflet DivIcon
   */
  dataUrl: string

  /**
   * Configuration used to generate the marker
   */
  config: Required<MarkerConfig>
}
