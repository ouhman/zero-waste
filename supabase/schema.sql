-- ================================================================
-- Zero Waste Frankfurt - Database Schema
-- ================================================================
-- This SQL file should be executed in the Supabase SQL Editor
-- Execute in order from top to bottom

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
  slug text UNIQUE NOT NULL,  -- e.g., 'bulk-shops', 'repair-cafes'
  icon text,  -- Icon identifier (Lucide icon name)
  color text,  -- Hex color for map markers
  sort_order int DEFAULT 0,  -- Display order
  created_at timestamptz DEFAULT now()
);

-- Locations table
CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,  -- SEO-friendly URL: 'gramm-frankfurt-nordend'
  description_de text,
  description_en text,

  -- Address
  address text NOT NULL,
  city text NOT NULL,
  postal_code text,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,

  -- Contact
  website text,
  phone text,
  email text,
  instagram text,

  -- Opening hours (free-form text for flexibility)
  opening_hours_text text,

  -- Submission info (no user accounts - email verification only)
  submission_type text DEFAULT 'new' CHECK (submission_type IN ('new', 'update')),
  submitted_by_email text,
  related_location_id uuid REFERENCES locations(id),

  -- Moderation
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  admin_notes text,

  -- Soft delete for GDPR/cleanup
  deleted_at timestamptz,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Full-text search vector (auto-generated)
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('german', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('german', coalesce(description_de, '')), 'B') ||
    setweight(to_tsvector('german', coalesce(address, '')), 'C')
  ) STORED
);

-- Location-Category junction table (many-to-many)
CREATE TABLE location_categories (
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (location_id, category_id)
);

-- Email verifications for submissions (no user accounts)
CREATE TABLE email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text UNIQUE NOT NULL,
  submission_data jsonb,  -- Stores the full submission until verified
  verified_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz DEFAULT now()
);

-- ================================================================
-- 3. INDEXES
-- ================================================================

-- Email verifications
CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_email_verifications_email ON email_verifications(email);

-- Geospatial index
CREATE INDEX idx_locations_geography
  ON locations
  USING GIST (ST_MakePoint(longitude, latitude)::geography);

-- Other location indexes
CREATE INDEX idx_locations_status ON locations(status);
CREATE INDEX idx_locations_city ON locations(city);
CREATE INDEX idx_locations_slug ON locations(slug);
CREATE INDEX idx_locations_search ON locations USING GIN (search_vector);

-- Junction table indexes
CREATE INDEX idx_location_categories_location ON location_categories(location_id);
CREATE INDEX idx_location_categories_category ON location_categories(category_id);

-- ================================================================
-- 4. TRIGGERS
-- ================================================================

-- Updated timestamp trigger
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

-- Auto-generate SEO-friendly slug
CREATE OR REPLACE FUNCTION generate_location_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  -- Create base slug from name and city
  base_slug := lower(regexp_replace(
    unaccent(NEW.name || '-' || NEW.city),
    '[^a-z0-9]+', '-', 'g'
  ));
  base_slug := trim(both '-' from base_slug);

  final_slug := base_slug;

  -- Handle duplicates
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

-- Full-text search function with prefix matching support
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

-- Find locations within radius
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
      ST_MakePoint(l.longitude, l.latitude)::geography,
      ST_MakePoint(lng, lat)::geography
    )::integer as distance_meters
  FROM locations l
  WHERE ST_DWithin(
    ST_MakePoint(l.longitude, l.latitude)::geography,
    ST_MakePoint(lng, lat)::geography,
    radius_meters
  )
  AND l.status = 'approved'
  AND l.deleted_at IS NULL
  ORDER BY distance_meters
$$ LANGUAGE sql STABLE;

-- ================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Categories RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify categories"
  ON categories FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Locations RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Public can view approved, non-deleted locations
CREATE POLICY "Anyone can view approved locations"
  ON locations FOR SELECT
  USING (status = 'approved' AND deleted_at IS NULL);

-- Admins have full access
CREATE POLICY "Admins have full access"
  ON locations FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Location Categories RLS
ALTER TABLE location_categories ENABLE ROW LEVEL SECURITY;

-- Location categories follow location visibility
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

-- Admins have full access to location categories
CREATE POLICY "Admins have full access to location categories"
  ON location_categories FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Email Verifications RLS
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- No public access - all operations go through Edge Functions with service role

-- ================================================================
-- 7. SEED DATA - 17 CATEGORIES
-- ================================================================

INSERT INTO categories (name_de, name_en, slug, icon, color, sort_order) VALUES
  ('Unverpackt-Läden', 'Bulk Shops', 'unverpackt', 'package-open', '#10B981', 1),
  ('Second-Hand Läden', 'Second-Hand Stores', 'second-hand', 'shirt', '#8B5CF6', 2),
  ('Feinkost & Frischetheke', 'Delicatessen & Fresh Counter', 'feinkost', 'cheese', '#F59E0B', 3),
  ('Bio & Regional', 'Organic & Local', 'bio-regional', 'leaf', '#22C55E', 4),
  ('Zero-Waste Gastronomie', 'Zero-Waste Dining', 'gastronomie', 'utensils', '#EC4899', 5),
  ('Bäckereien', 'Bakeries', 'baeckereien', 'croissant', '#D97706', 6),
  ('Milchtankstellen', 'Milk Dispensers', 'milchtankstellen', 'milk', '#3B82F6', 7),
  ('Hofläden', 'Farm Shops', 'hoflaeden', 'home', '#84CC16', 8),
  ('Haushalt & Pflege', 'Household & Care', 'haushalt-pflege', 'sparkles', '#14B8A6', 9),
  ('Nachhaltige Mode', 'Sustainable Fashion', 'nachhaltige-mode', 'scissors', '#A855F7', 10),
  ('Teilen & Tauschen', 'Share & Swap', 'teilen-tauschen', 'repeat', '#06B6D4', 11),
  ('Wochenmärkte', 'Weekly Markets', 'wochenmaerkte', 'store', '#EF4444', 12),
  ('Flohmärkte', 'Flea Markets', 'flohmaerkte', 'tag', '#F97316', 13),
  ('Repair-Cafés', 'Repair Cafés', 'repair-cafes', 'wrench', '#6366F1', 14),
  ('Trinkwasser', 'Drinking Water', 'trinkwasser', 'droplet', '#0EA5E9', 15),
  ('Nachhaltig übernachten', 'Sustainable Accommodation', 'uebernachten', 'bed', '#78716C', 16),
  ('Andere', 'Other', 'andere', 'more-horizontal', '#6B7280', 17);

-- ================================================================
-- 8. SEED DATA - 10 SAMPLE LOCATIONS
-- ================================================================

-- We'll create temporary variables to store category IDs
DO $$
DECLARE
  unverpackt_id uuid;
  second_hand_id uuid;
  bio_regional_id uuid;
  repair_id uuid;
  gastro_id uuid;
  location_id uuid;
BEGIN
  -- Get category IDs
  SELECT id INTO unverpackt_id FROM categories WHERE slug = 'unverpackt';
  SELECT id INTO second_hand_id FROM categories WHERE slug = 'second-hand';
  SELECT id INTO bio_regional_id FROM categories WHERE slug = 'bio-regional';
  SELECT id INTO repair_id FROM categories WHERE slug = 'repair-cafes';
  SELECT id INTO gastro_id FROM categories WHERE slug = 'gastronomie';

  -- Location 1: Gramm Genau (Unverpackt)
  INSERT INTO locations (name, description_de, description_en, address, city, postal_code, latitude, longitude, website, status)
  VALUES (
    'Gramm Genau',
    'Unverpackt-Laden mit großer Auswahl an Bio-Lebensmitteln',
    'Bulk shop with large selection of organic foods',
    'Berger Straße 235',
    'Frankfurt',
    '60385',
    50.1245,
    8.7103,
    'https://www.grammgenau.de',
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, unverpackt_id);

  -- Location 2: Oxfam Shop
  INSERT INTO locations (name, description_de, description_en, address, city, postal_code, latitude, longitude, website, status)
  VALUES (
    'Oxfam Shop',
    'Second-Hand Laden mit fairen Preisen',
    'Second-hand shop with fair prices',
    'Leipziger Straße 17',
    'Frankfurt',
    '60487',
    50.1287,
    8.6643,
    'https://www.oxfam.de',
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, second_hand_id);

  -- Location 3: Biomarkt Konstablerwache
  INSERT INTO locations (name, description_de, description_en, address, city, postal_code, latitude, longitude, status)
  VALUES (
    'Biomarkt Konstablerwache',
    'Bio-Markt mit regionalem Sortiment',
    'Organic market with regional products',
    'Konstablerwache',
    'Frankfurt',
    '60313',
    50.1150,
    8.6933,
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, bio_regional_id);

  -- Location 4: Repair Café Bornheim
  INSERT INTO locations (name, description_de, description_en, address, city, postal_code, latitude, longitude, opening_hours_text, status)
  VALUES (
    'Repair Café Bornheim',
    'Reparatur-Café für Elektrogeräte und Textilien',
    'Repair café for electronics and textiles',
    'Arnsburger Straße 24',
    'Frankfurt',
    '60385',
    50.1312,
    8.7205,
    'Jeden 2. Samstag 14-17 Uhr',
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, repair_id);

  -- Location 5: Gerbermühle (Zero-Waste Restaurant)
  INSERT INTO locations (name, description_de, description_en, address, city, postal_code, latitude, longitude, website, status)
  VALUES (
    'Gerbermühle',
    'Restaurant mit Fokus auf Regionalität und Nachhaltigkeit',
    'Restaurant focusing on regional and sustainable cuisine',
    'Gerbermühlstraße 105',
    'Frankfurt',
    '60594',
    50.0950,
    8.7122,
    'https://www.gerbermuehle.de',
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, gastro_id);

  -- Location 6: Unverpackt Bockenheim
  INSERT INTO locations (name, description_de, description_en, address, city, postal_code, latitude, longitude, status)
  VALUES (
    'Unverpackt Bockenheim',
    'Unverpackt-Laden im Herzen von Bockenheim',
    'Bulk shop in the heart of Bockenheim',
    'Leipziger Straße 50',
    'Frankfurt',
    '60487',
    50.1244,
    8.6588,
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, unverpackt_id);

  -- Location 7: Fairkauf Second Hand
  INSERT INTO locations (name, description_de, description_en, address, city, postal_code, latitude, longitude, status)
  VALUES (
    'Fairkauf Second Hand',
    'Second-Hand Kaufhaus mit großer Auswahl',
    'Second-hand department store with wide selection',
    'Hanauer Landstraße 204',
    'Frankfurt',
    '60314',
    50.1167,
    8.7245,
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, second_hand_id);

  -- Location 8: Biomarkt Nordend
  INSERT INTO locations (name, description_de, description_en, address, city, postal_code, latitude, longitude, status)
  VALUES (
    'Biomarkt Nordend',
    'Bio-Supermarkt mit unverpackter Abteilung',
    'Organic supermarket with bulk section',
    'Friedberger Landstraße 94',
    'Frankfurt',
    '60316',
    50.1289,
    8.7089,
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, bio_regional_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, unverpackt_id);

  -- Location 9: Repair Café Sachsenhausen
  INSERT INTO locations (name, description_de, description_en, address, city, postal_code, latitude, longitude, opening_hours_text, status)
  VALUES (
    'Repair Café Sachsenhausen',
    'Ehrenamtliches Reparatur-Café',
    'Volunteer-run repair café',
    'Brückenstraße 3-7',
    'Frankfurt',
    '60594',
    50.1034,
    8.6789,
    'Jeden 1. Samstag 14-18 Uhr',
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, repair_id);

  -- Location 10: Café Maingold (Zero-Waste)
  INSERT INTO locations (name, description_de, description_en, address, city, postal_code, latitude, longitude, website, status)
  VALUES (
    'Café Maingold',
    'Café mit Zero-Waste Konzept und Bio-Kaffee',
    'Café with zero-waste concept and organic coffee',
    'Schäfergasse 30',
    'Frankfurt',
    '60313',
    50.1134,
    8.6789,
    'https://www.cafe-maingold.de',
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, gastro_id);
END $$;

-- ================================================================
-- SCHEMA COMPLETE
-- ================================================================
-- You should now have:
-- - 17 categories
-- - 10 approved sample locations
-- - All necessary indexes and RLS policies
-- - PostGIS functions for geospatial queries
--
-- Next steps:
-- 1. Verify with: SELECT COUNT(*) FROM categories; (should return 17)
-- 2. Verify with: SELECT COUNT(*) FROM locations WHERE status = 'approved'; (should return 10)
-- 3. Generate TypeScript types with: npx supabase gen types typescript
-- ================================================================
