-- Migrate existing categories to use dynamic markers
-- Maps category slugs to Iconify icon names and colors
-- Part of Dynamic Markers implementation (Phase 5)

-- Update categories with icon_name and color based on slug
UPDATE categories SET
  icon_name = 'mdi:tools',
  color = '#F59E0B',
  marker_size = 32
WHERE slug = 'repair-cafes';

UPDATE categories SET
  icon_name = 'mdi:bread-slice',
  color = '#92400E',
  marker_size = 32
WHERE slug = 'baeckereien';

UPDATE categories SET
  icon_name = 'mdi:silverware-fork-knife',
  color = '#DC2626',
  marker_size = 32
WHERE slug = 'gastronomie';

UPDATE categories SET
  icon_name = 'mdi:hanger',
  color = '#8B5CF6',
  marker_size = 32
WHERE slug = 'second-hand';

UPDATE categories SET
  icon_name = 'mdi:tag-multiple',
  color = '#EC4899',
  marker_size = 32
WHERE slug = 'flohmaerkte';

UPDATE categories SET
  icon_name = 'mdi:fruit-cherries',
  color = '#10B981',
  marker_size = 32
WHERE slug = 'wochenmaerkte';

UPDATE categories SET
  icon_name = 'mdi:leaf',
  color = '#22C55E',
  marker_size = 32
WHERE slug = 'bio-regional';

UPDATE categories SET
  icon_name = 'mdi:barn',
  color = '#A16207',
  marker_size = 32
WHERE slug = 'hoflaeden';

UPDATE categories SET
  icon_name = 'mdi:package-variant',
  color = '#0EA5E9',
  marker_size = 32
WHERE slug = 'unverpackt';

UPDATE categories SET
  icon_name = 'mdi:cheese',
  color = '#EAB308',
  marker_size = 32
WHERE slug = 'feinkost';

UPDATE categories SET
  icon_name = 'mdi:spray-bottle',
  color = '#6366F1',
  marker_size = 32
WHERE slug = 'haushalt-pflege';

UPDATE categories SET
  icon_name = 'mdi:cow',
  color = '#F9FAFB',
  marker_size = 32
WHERE slug = 'milchtankstellen';

UPDATE categories SET
  icon_name = 'mdi:swap-horizontal',
  color = '#14B8A6',
  marker_size = 32
WHERE slug = 'teilen-tauschen';

UPDATE categories SET
  icon_name = 'mdi:bed',
  color = '#6B7280',
  marker_size = 32
WHERE slug = 'uebernachten';

UPDATE categories SET
  icon_name = 'mdi:tshirt-crew',
  color = '#F472B6',
  marker_size = 32
WHERE slug = 'nachhaltige-mode';

UPDATE categories SET
  icon_name = 'mdi:water',
  color = '#3B82F6',
  marker_size = 32
WHERE slug = 'trinkwasser';

UPDATE categories SET
  icon_name = 'mdi:bookshelf',
  color = '#78350F',
  marker_size = 32
WHERE slug = 'buecherschrank';

UPDATE categories SET
  icon_name = 'mdi:map-marker',
  color = '#9CA3AF',
  marker_size = 32
WHERE slug = 'andere';
