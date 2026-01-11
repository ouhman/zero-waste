-- ================================================================
-- Migration: Create slugify() SQL function
-- ================================================================
-- This function creates URL-friendly slugs with proper German character
-- handling and normalization.
--
-- Features:
--   - German character replacement (ä→ae, ö→oe, ü→ue, ß→ss)
--   - Unicode normalization and diacritic removal
--   - Replace non-alphanumeric with hyphens
--   - Trim leading/trailing hyphens
--   - Lowercase everything
--
-- Examples:
--   slugify('Bäckerei Müller') → 'baeckerei-mueller'
--   slugify('Café & Restaurant') → 'cafe-restaurant'
--   slugify('Straße 123') → 'strasse-123'
-- ================================================================

CREATE OR REPLACE FUNCTION slugify(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Return empty string if input is NULL or empty
  IF text_input IS NULL OR text_input = '' THEN
    RETURN '';
  END IF;

  result := text_input;

  -- Step 1: Replace German special characters BEFORE unaccent
  -- This ensures proper German orthography (ä→ae not just a)
  result := replace(result, 'ä', 'ae');
  result := replace(result, 'Ä', 'ae');
  result := replace(result, 'ö', 'oe');
  result := replace(result, 'Ö', 'oe');
  result := replace(result, 'ü', 'ue');
  result := replace(result, 'Ü', 'ue');
  result := replace(result, 'ß', 'ss');

  -- Step 2: Lowercase
  result := lower(result);

  -- Step 3: Remove remaining diacritics (café → cafe)
  result := unaccent(result);

  -- Step 4: Replace non-alphanumeric characters with hyphens
  -- Keep only: a-z, 0-9, and convert everything else to hyphen
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');

  -- Step 5: Collapse multiple consecutive hyphens into one
  result := regexp_replace(result, '-+', '-', 'g');

  -- Step 6: Trim leading and trailing hyphens
  result := trim(both '-' from result);

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment
COMMENT ON FUNCTION slugify(TEXT) IS
  'Convert text to URL-friendly slug with German character support. Returns lowercase alphanumeric string with hyphens.';
