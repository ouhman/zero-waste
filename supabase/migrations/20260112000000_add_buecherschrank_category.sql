-- Phase 1: Create Bücherschrank category
-- This migration adds a new category for public bookcases

-- Check if category already exists to make this migration idempotent
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
);
