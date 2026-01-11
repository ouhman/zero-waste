-- ================================================================
-- Migration: Add suburb column to locations table
-- ================================================================
-- This migration adds a nullable suburb column that will be populated
-- from Nominatim data for more precise slug generation.
--
-- Examples:
--   - Frankfurt am Main > Bockenheim
--   - Frankfurt am Main > Nordend
--   - Bad Homburg > NULL (no suburb)
-- ================================================================

-- Add suburb column
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS suburb TEXT;

-- Create index for suburb lookups
CREATE INDEX IF NOT EXISTS idx_locations_suburb ON locations(suburb);

-- Update comment
COMMENT ON COLUMN locations.suburb IS 'Suburb/district name from Nominatim (e.g., Bockenheim, Nordend). Used for slug generation.';
