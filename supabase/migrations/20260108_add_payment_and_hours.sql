-- ================================================================
-- Enhanced OSM Data Enrichment - Payment & Opening Hours
-- ================================================================
-- Migration: Add payment methods and structured opening hours
-- Created: 2026-01-08
-- Part of: Phase 1 - Database Schema Extension
-- ================================================================

-- Add new columns to locations table
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS payment_methods JSONB,
  ADD COLUMN IF NOT EXISTS opening_hours_osm TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours_structured JSONB;

-- Add GIN indexes for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_locations_payment_methods
  ON locations USING GIN (payment_methods);

CREATE INDEX IF NOT EXISTS idx_locations_opening_hours_structured
  ON locations USING GIN (opening_hours_structured);

-- Add comments for documentation
COMMENT ON COLUMN locations.payment_methods IS
  'Payment methods extracted from OSM payment:* tags. Format: {"cash": true, "credit_cards": true, "ec_cards": true, "contactless": true}';

COMMENT ON COLUMN locations.opening_hours_osm IS
  'Raw OSM opening_hours tag value. Format: "Mo-Fr 09:00-18:00; Sa 10:00-16:00"';

COMMENT ON COLUMN locations.opening_hours_structured IS
  'Parsed opening hours for programmatic use. Format: {"entries": [{"day": "monday", "opens": "09:00", "closes": "18:00"}], "special": null}';
