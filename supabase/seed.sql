-- ================================================================
-- Development Seed Data for Zero Waste Frankfurt
-- ================================================================
-- This file is only applied to development environments
-- Run with: npx supabase db reset (starts fresh + seeds)
-- ================================================================

-- ================================================================
-- 1. SEED CATEGORIES
-- ================================================================
-- Note: These match production categories but can be modified for testing

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
  ('Andere', 'Other', 'andere', 'more-horizontal', '#6B7280', 17)
ON CONFLICT (slug) DO NOTHING;

-- ================================================================
-- 2. SEED TEST LOCATIONS
-- ================================================================
-- Insert 10 test locations for development testing

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

  -- Location 1: Test Bulk Shop
  INSERT INTO locations (name, description_de, description_en, address, city, postal_code, latitude, longitude, website, phone, status)
  VALUES (
    'Test Unverpackt Nordend',
    'Test-Location für Entwicklung - Unverpackt-Laden',
    'Test location for development - bulk shop',
    'Berger Straße 100',
    'Frankfurt am Main',
    '60316',
    50.1256,
    8.7089,
    'https://test-unverpackt.example.com',
    '+49 69 12345678',
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, unverpackt_id);

  -- Location 2: Test Second-Hand
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, status)
  VALUES (
    'Test Second-Hand Bockenheim',
    'Test-Location - Second-Hand Shop',
    'Leipziger Straße 30',
    'Frankfurt am Main',
    '60487',
    50.1244,
    8.6598,
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, second_hand_id);

  -- Location 3: Test Bio Market
  INSERT INTO locations (name, description_de, address, city, latitude, longitude, status)
  VALUES (
    'Test Bio-Markt Sachsenhausen',
    'Test-Location - Bio-Markt',
    'Schweizer Straße 50',
    'Frankfurt am Main',
    50.1034,
    8.6889,
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, bio_regional_id);

  -- Location 4: Test Repair Café
  INSERT INTO locations (name, description_de, address, city, latitude, longitude, opening_hours, status)
  VALUES (
    'Test Repair Café Bornheim',
    'Test-Location - Repair Café',
    'Arnsburger Straße 10',
    'Frankfurt am Main',
    50.1312,
    8.7195,
    'Mo-Fr 10:00-18:00',
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, repair_id);

  -- Location 5: Test Restaurant
  INSERT INTO locations (name, description_de, address, city, latitude, longitude, website, email, status)
  VALUES (
    'Test Zero-Waste Restaurant',
    'Test-Location - Nachhaltiges Restaurant',
    'Mainkai 1',
    'Frankfurt am Main',
    50.1090,
    8.6833,
    'https://test-restaurant.example.com',
    'info@test-restaurant.example.com',
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, gastro_id);

  -- Location 6: Pending submission (for testing admin panel)
  INSERT INTO locations (name, description_de, address, city, latitude, longitude, status, submitted_by_email)
  VALUES (
    'Pending Test Location',
    'Diese Location wartet auf Genehmigung',
    'Teststraße 99',
    'Frankfurt am Main',
    50.1100,
    8.6900,
    'pending',
    'test@example.com'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, unverpackt_id);

  -- Location 7: Test with multiple categories
  INSERT INTO locations (name, description_de, address, city, latitude, longitude, status)
  VALUES (
    'Test Multi-Category Shop',
    'Test-Location mit mehreren Kategorien',
    'Zeil 100',
    'Frankfurt am Main',
    50.1147,
    8.6889,
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES 
    (location_id, unverpackt_id),
    (location_id, bio_regional_id);

  -- Location 8: Test with full contact info
  INSERT INTO locations (
    name, description_de, address, city, postal_code, latitude, longitude,
    website, phone, email, instagram, opening_hours, status
  )
  VALUES (
    'Test Full Contact Info',
    'Test-Location mit allen Kontaktdaten',
    'Bockenheimer Landstraße 50',
    'Frankfurt am Main',
    '60325',
    50.1189,
    8.6611,
    'https://test-full.example.com',
    '+49 69 98765432',
    'info@test-full.example.com',
    'test.full.shop',
    'Mo-Fr 09:00-18:30; Sa 10:00-16:00',
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, unverpackt_id);

  -- Location 9: Test with suburb field (for slug testing)
  INSERT INTO locations (name, description_de, address, city, suburb, latitude, longitude, status)
  VALUES (
    'Test Suburban Location',
    'Test-Location mit Stadtteil',
    'Kennedyallee 100',
    'Frankfurt am Main',
    'Westend',
    50.1178,
    8.6556,
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, second_hand_id);

  -- Location 10: Test with payment methods and structured hours
  INSERT INTO locations (
    name, description_de, address, city, latitude, longitude,
    payment_methods, opening_hours, opening_hours_raw, status
  )
  VALUES (
    'Test Payment & Hours',
    'Test-Location mit Zahlungsmethoden und Öffnungszeiten',
    'Kaiserstraße 50',
    'Frankfurt am Main',
    50.1089,
    8.6689,
    '{"cash": true, "credit_cards": true, "ec_cards": true, "contactless": true}'::jsonb,
    'Mo-Fr 08:00-20:00; Sa 09:00-18:00',
    'Mo-Fr 08:00-20:00; Sa 09:00-18:00',
    'approved'
  ) RETURNING id INTO location_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (location_id, bio_regional_id);

END $$;

-- ================================================================
-- 3. SEED ADMIN USER DATA (Optional - for reference)
-- ================================================================
-- Admin users must be created manually via Supabase Dashboard
-- Then run in SQL Editor:
-- 
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'),
--   '{role}',
--   '"admin"'
-- )
-- WHERE email = 'your-admin@example.com';
-- ================================================================

-- Seed complete message
DO $$
BEGIN
  RAISE NOTICE '=== Seed Data Complete ===';
  RAISE NOTICE 'Categories: %', (SELECT COUNT(*) FROM categories);
  RAISE NOTICE 'Locations: %', (SELECT COUNT(*) FROM locations);
  RAISE NOTICE 'Approved: %', (SELECT COUNT(*) FROM locations WHERE status = ''approved'');
  RAISE NOTICE 'Pending: %', (SELECT COUNT(*) FROM locations WHERE status = ''pending'');
END $$;
