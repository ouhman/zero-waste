-- Add columns for icon URL and descriptions to categories table
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS icon_url TEXT,
ADD COLUMN IF NOT EXISTS description_de TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create storage bucket for category icons (public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-icons', 'category-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for category icons

-- Allow public read access to category icons
CREATE POLICY "Category icons are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'category-icons');

-- Allow authenticated admins to upload category icons
CREATE POLICY "Admins can upload category icons"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'category-icons'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Allow authenticated admins to delete category icons
CREATE POLICY "Admins can delete category icons"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'category-icons'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Allow authenticated admins to update category icons
CREATE POLICY "Admins can update category icons"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'category-icons'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
