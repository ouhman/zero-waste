-- Fix search_locations to support prefix/substring matching
-- The previous implementation only used full-text search which doesn't match partial words
-- (e.g., "auff" would not match "Auffüllerei")

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
  )
    AND status = 'approved'
    AND deleted_at IS NULL
  ORDER BY
    -- Prioritize exact name matches, then full-text rank
    CASE WHEN name ILIKE search_term || '%' THEN 0 ELSE 1 END,
    ts_rank(search_vector, plainto_tsquery('german', search_term)) DESC
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION search_locations(text) IS
  'Search locations by name/address using full-text search and prefix matching. Only returns approved locations.';
