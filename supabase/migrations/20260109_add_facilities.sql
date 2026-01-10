-- ================================================================
-- Add Facilities Column for Additional Amenities
-- ================================================================
-- Migration: Add facilities JSONB column
-- Created: 2026-01-09
-- Purpose: Store additional amenities like toilets, wheelchair access, etc.
-- ================================================================

-- Add facilities column to locations table
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS facilities JSONB;

-- Add GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_locations_facilities
  ON locations USING GIN (facilities);

-- Add comments for documentation
COMMENT ON COLUMN locations.facilities IS
  'Additional facilities and amenities extracted from OSM. Format: {"toilets": true, "wheelchair": true, "wifi": true, "organic": true}';
