-- ================================================================
-- Migration: Update slug generation trigger
-- ================================================================
-- Replace the old generate_location_slug() trigger with the new
-- generate_unique_slug() function that uses suburb data.
--
-- This will automatically regenerate slugs when:
--   - New location is inserted
--   - Name, city, or suburb is updated
-- ================================================================

-- Drop old trigger and function
DROP TRIGGER IF EXISTS locations_generate_slug ON locations;
DROP FUNCTION IF EXISTS generate_location_slug();

-- Create new trigger function that uses generate_unique_slug
CREATE OR REPLACE FUNCTION trigger_generate_location_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate slug using the new function
  NEW.slug := generate_unique_slug(
    NEW.name,
    COALESCE(NEW.suburb, ''),
    NEW.city
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER locations_generate_slug
  BEFORE INSERT OR UPDATE OF name, city, suburb ON locations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_location_slug();

-- Add comment
COMMENT ON FUNCTION trigger_generate_location_slug() IS
  'Trigger function that auto-generates unique slug when location name, city, or suburb changes.';
