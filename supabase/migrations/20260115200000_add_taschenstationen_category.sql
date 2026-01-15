-- Add Taschenstationen category for reusable bag distribution points
-- Idempotent: uses WHERE NOT EXISTS to prevent duplicates

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
  'taschenstationen',
  'Taschenstationen',
  'Bag Stations',
  '📦',
  '#00796B',
  'Ausgabestellen für wiederverwendbare Taschen',
  'Distribution points for reusable bags',
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories)
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE slug = 'taschenstationen'
);
