-- Phase 1: Create Bücherschrank Category
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lccpndhssuemudzpfvvg/sql/new

-- Step 1: Check if category already exists
SELECT
  id,
  slug,
  name_de,
  name_en,
  icon,
  color,
  description_de,
  description_en,
  created_at
FROM categories
WHERE slug = 'buecherschrank';

-- Step 2: Create category if it doesn't exist
INSERT INTO categories (
  slug,
  name_de,
  name_en,
  icon,
  color,
  description_de,
  description_en,
  sort_order
)
SELECT
  'buecherschrank',
  'Bücherschrank',
  'Public Bookcase',
  '📚',
  '#8B4513',
  'Offene Bücherschränke zum kostenlosen Tauschen und Ausleihen von Büchern',
  'Public bookcases for free book exchange',
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories)
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE slug = 'buecherschrank'
)
RETURNING *;

-- Step 3: Verify it was created
SELECT
  id,
  slug,
  name_de,
  name_en,
  icon,
  color,
  description_de,
  description_en,
  created_at
FROM categories
WHERE slug = 'buecherschrank';
