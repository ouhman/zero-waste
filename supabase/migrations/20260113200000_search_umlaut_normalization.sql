-- Add German umlaut normalization to search
-- Allows searching "bucher" to match "Bücherschrank"

-- Helper function to normalize German characters
CREATE OR REPLACE FUNCTION normalize_german(text_input text)
RETURNS text AS $$
  SELECT translate(
    lower(text_input),
    'äöüßáàâéèêíìîóòôúùû',
    'aousaaaeeeiiiooouu'
  )
$$ LANGUAGE sql IMMUTABLE;

COMMENT ON FUNCTION normalize_german(text) IS
  'Normalize German umlauts and accented characters for search matching';

-- Update search_locations to support umlaut-insensitive search
CREATE OR REPLACE FUNCTION search_locations(search_term text)
RETURNS SETOF locations AS $$
  SELECT *
  FROM locations
  WHERE (
    -- Full-text search for complete words/stems
    search_vector @@ plainto_tsquery('german', search_term)
    OR
    -- Prefix/substring matching on name (case-insensitive)
    name ILIKE '%' || search_term || '%'
    OR
    -- Prefix/substring matching on address
    address ILIKE '%' || search_term || '%'
    OR
    -- Umlaut-normalized matching on name
    normalize_german(name) LIKE '%' || normalize_german(search_term) || '%'
    OR
    -- Umlaut-normalized matching on address
    normalize_german(address) LIKE '%' || normalize_german(search_term) || '%'
  )
    AND status = 'approved'
    AND deleted_at IS NULL
  ORDER BY
    -- Prioritize exact name matches, then normalized matches, then full-text rank
    CASE
      WHEN name ILIKE search_term || '%' THEN 0
      WHEN normalize_german(name) LIKE normalize_german(search_term) || '%' THEN 1
      ELSE 2
    END,
    ts_rank(search_vector, plainto_tsquery('german', search_term)) DESC
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION search_locations(text) IS
  'Search locations by name/address using full-text search, prefix matching, and umlaut normalization. Only returns approved locations.';
