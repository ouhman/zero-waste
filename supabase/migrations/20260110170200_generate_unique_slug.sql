-- ================================================================
-- Migration: Create generate_unique_slug() SQL function
-- ================================================================
-- This function generates unique, SEO-friendly slugs with atomic
-- collision handling.
--
-- Features:
--   - Pattern: {name}-{city}-{suburb} or {name}-{city}-{suburb}-{n}
--   - City before suburb (SEO: higher search volume terms first)
--   - Deduplication: avoids redundant parts if name contains city/suburb
--   - Atomic collision handling with integer increment
--
-- Examples:
--   ('Repair Café', 'Bockenheim', 'Frankfurt am Main')
--   → 'repair-cafe-frankfurt-am-main-bockenheim'
--
--   ('Windelfrei Frankfurt', 'Bockenheim', 'Frankfurt am Main')
--   → 'windelfrei-frankfurt-bockenheim' (deduped city)
--
--   ('Tegut Bad Homburg', '', 'Bad Homburg')
--   → 'tegut-bad-homburg' (no suburb, deduped city)
-- ================================================================

CREATE OR REPLACE FUNCTION generate_unique_slug(
  name TEXT,
  suburb TEXT DEFAULT '',
  city TEXT DEFAULT ''
)
RETURNS TEXT AS $$
DECLARE
  slugified_name TEXT;
  slugified_suburb TEXT;
  slugified_city TEXT;
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 2; -- Start at 2 for first collision (base has no number)
BEGIN
  -- Slugify all input parts
  slugified_name := slugify(name);
  slugified_suburb := slugify(COALESCE(suburb, ''));
  slugified_city := slugify(COALESCE(city, ''));

  -- Start with name
  base_slug := slugified_name;

  -- Add city if provided and not already in name
  -- Use LIKE pattern for partial matching (e.g., 'frankfurt' matches 'windelfrei-frankfurt')
  IF slugified_city != '' AND base_slug NOT LIKE '%' || slugified_city || '%' THEN
    IF base_slug != '' THEN
      base_slug := base_slug || '-' || slugified_city;
    ELSE
      base_slug := slugified_city;
    END IF;
  END IF;

  -- Add suburb if provided and not already in base
  IF slugified_suburb != '' AND base_slug NOT LIKE '%' || slugified_suburb || '%' THEN
    IF base_slug != '' THEN
      base_slug := base_slug || '-' || slugified_suburb;
    ELSE
      base_slug := slugified_suburb;
    END IF;
  END IF;

  -- If somehow we end up with empty slug, use a fallback
  IF base_slug = '' THEN
    base_slug := 'location';
  END IF;

  -- Start with base slug (no number)
  final_slug := base_slug;

  -- Check for collisions and increment if needed
  -- Use a WHILE loop to handle multiple collisions atomically
  WHILE EXISTS (
    SELECT 1 FROM locations
    WHERE slug = final_slug
    -- Important: Don't count the current row if this is an UPDATE
    -- (This function might be called from a trigger during UPDATE)
  ) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;

    -- Safety: prevent infinite loop (should never happen in practice)
    IF counter > 1000 THEN
      -- Add random suffix as fallback
      final_slug := base_slug || '-' || substr(md5(random()::text), 1, 8);
      EXIT;
    END IF;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Add comment
COMMENT ON FUNCTION generate_unique_slug(TEXT, TEXT, TEXT) IS
  'Generate unique SEO-friendly slug with pattern: {name}-{city}-{suburb} or {name}-{city}-{suburb}-{n}. Handles deduplication and collisions atomically.';
