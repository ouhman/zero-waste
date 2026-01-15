-- Add dynamic marker fields to categories table
-- Part of Dynamic Markers implementation (Phase 1)
-- See: ai/plans/2026-01-15-dynamic-markers.md

-- Add icon_name field for Iconify icon identifiers
-- Format: {icon-set}:{icon-name} (e.g., 'mdi:recycle', 'lucide:store')
ALTER TABLE categories ADD COLUMN icon_name TEXT;

-- Add marker_size field for future size customization
-- Default: 32px (current marker size)
ALTER TABLE categories ADD COLUMN marker_size INTEGER DEFAULT 32;

-- Add comments for documentation
COMMENT ON COLUMN categories.icon_name IS 'Iconify icon identifier (e.g., mdi:recycle, lucide:store)';
COMMENT ON COLUMN categories.marker_size IS 'Marker size in pixels (default: 32)';

-- Note: icon_url column is kept for backward compatibility during transition
-- Will be deprecated after migration in Phase 5
