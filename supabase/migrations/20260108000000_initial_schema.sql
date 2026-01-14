-- ================================================================
-- Zero Waste Frankfurt - Initial Database Schema
-- ================================================================
-- Migration: Initial schema baseline
-- Created: 2026-01-08 (retroactive baseline)
-- Note: This migration represents the initial database state
--       before incremental migrations were applied.
-- ================================================================

-- ================================================================
-- 1. EXTENSIONS
-- ================================================================

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable unaccent for slug generation
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ================================================================
-- 2. TABLES
-- ================================================================

-- Categories table (17 confirmed categories)
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_de text NOT NULL,
  name_en text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  color text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Locations table
CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  description_de text,
  description_en text,

  address text NOT NULL,
  city text NOT NULL,
  postal_code text,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,

  website text,
  phone text,
  email text,
  instagram text,

  opening_hours_text text,

  submission_type text DEFAULT 'new' CHECK (submission_type IN ('new', 'update')),
  submitted_by_email text,
  related_location_id uuid REFERENCES locations(id),

  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  admin_notes text,

  deleted_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('german', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('german', coalesce(description_de, '')), 'B') ||
    setweight(to_tsvector('german', coalesce(address, '')), 'C')
  ) STORED
);

CREATE TABLE location_categories (
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (location_id, category_id)
);

CREATE TABLE email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text UNIQUE NOT NULL,
  submission_data jsonb,
  verified_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz DEFAULT now()
);

-- ================================================================
-- 3. INDEXES
-- ================================================================

CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_email_verifications_email ON email_verifications(email);

CREATE INDEX idx_locations_geography
  ON locations
  USING GIST (geography(ST_MakePoint(longitude, latitude)));

CREATE INDEX idx_locations_status ON locations(status);
CREATE INDEX idx_locations_city ON locations(city);
CREATE INDEX idx_locations_slug ON locations(slug);
CREATE INDEX idx_locations_search ON locations USING GIN (search_vector);

CREATE INDEX idx_location_categories_location ON location_categories(location_id);
CREATE INDEX idx_location_categories_category ON location_categories(category_id);

-- ================================================================
-- 4. TRIGGERS
-- ================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION generate_location_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  base_slug := lower(regexp_replace(
    unaccent(NEW.name || '-' || NEW.city),
    '[^a-z0-9]+', '-', 'g'
  ));
  base_slug := trim(both '-' from base_slug);

  final_slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM locations WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER locations_generate_slug
  BEFORE INSERT OR UPDATE OF name, city ON locations
  FOR EACH ROW
  EXECUTE FUNCTION generate_location_slug();

-- ================================================================
-- 5. FUNCTIONS
-- ================================================================

CREATE OR REPLACE FUNCTION search_locations(search_term text)
RETURNS SETOF locations AS $$
  SELECT *
  FROM locations
  WHERE (
    search_vector @@ plainto_tsquery('german', search_term)
    OR
    name ILIKE '%' || search_term || '%'
    OR
    address ILIKE '%' || search_term || '%'
  )
    AND status = 'approved'
    AND deleted_at IS NULL
  ORDER BY
    CASE WHEN name ILIKE search_term || '%' THEN 0 ELSE 1 END,
    ts_rank(search_vector, plainto_tsquery('german', search_term)) DESC
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION search_locations(text) IS
  'Search locations by name/address using full-text search and prefix matching. Only returns approved locations.';

CREATE OR REPLACE FUNCTION locations_nearby(
  lat decimal,
  lng decimal,
  radius_meters integer DEFAULT 5000
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  address text,
  latitude decimal,
  longitude decimal,
  distance_meters integer
) AS $$
  SELECT
    l.id,
    l.name,
    l.slug,
    l.address,
    l.latitude,
    l.longitude,
    ST_Distance(
      geography(ST_MakePoint(l.longitude, l.latitude)),
      geography(ST_MakePoint(lng, lat))
    )::integer as distance_meters
  FROM locations l
  WHERE ST_DWithin(
    geography(ST_MakePoint(l.longitude, l.latitude)),
    geography(ST_MakePoint(lng, lat)),
    radius_meters
  )
  AND l.status = 'approved'
  AND l.deleted_at IS NULL
  ORDER BY distance_meters
$$ LANGUAGE sql STABLE;

-- ================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify categories"
  ON categories FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved locations"
  ON locations FOR SELECT
  USING (status = 'approved' AND deleted_at IS NULL);

CREATE POLICY "Admins have full access"
  ON locations FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

ALTER TABLE location_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Location categories are publicly readable for approved locations"
  ON location_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM locations l
      WHERE l.id = location_id
      AND l.status = 'approved'
      AND l.deleted_at IS NULL
    )
  );

CREATE POLICY "Admins have full access to location categories"
  ON location_categories FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
