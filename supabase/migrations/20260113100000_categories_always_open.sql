-- Add always_open flag to categories
-- For categories like Bücherschrank, Trinkbrunnen that are always accessible

ALTER TABLE categories
ADD COLUMN always_open BOOLEAN DEFAULT FALSE;

-- Set existing categories that are always open
UPDATE categories SET always_open = TRUE WHERE slug IN ('buecherschrank', 'trinkbrunnen');

-- Add comment for documentation
COMMENT ON COLUMN categories.always_open IS 'If true, locations in this category are considered 24/7 available (e.g., book sharing cabinets, drinking fountains)';
