-- Migrate admin role checks from user_metadata to app_metadata
-- user_metadata is editable by end users and must never be used for authorization
-- app_metadata can only be set server-side (service role key, dashboard, admin API)

-- ============================================================
-- 1. PUBLIC TABLE POLICIES
-- ============================================================

-- categories: "Only admins can modify categories"
DROP POLICY IF EXISTS "Only admins can modify categories" ON categories;
CREATE POLICY "Only admins can modify categories"
  ON categories FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- locations: "Admins have full access"
DROP POLICY IF EXISTS "Admins have full access" ON locations;
CREATE POLICY "Admins have full access"
  ON locations FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- location_categories: "Admins have full access to location categories"
DROP POLICY IF EXISTS "Admins have full access to location categories" ON location_categories;
CREATE POLICY "Admins have full access to location categories"
  ON location_categories FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- auth_rate_limits: "Only admins can view rate limits"
DROP POLICY IF EXISTS "Only admins can view rate limits" ON auth_rate_limits;
CREATE POLICY "Only admins can view rate limits"
  ON auth_rate_limits FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- hours_suggestions: "Admins can view all suggestions"
DROP POLICY IF EXISTS "Admins can view all suggestions" ON hours_suggestions;
CREATE POLICY "Admins can view all suggestions"
  ON hours_suggestions FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- hours_suggestions: "Admins can update suggestions"
DROP POLICY IF EXISTS "Admins can update suggestions" ON hours_suggestions;
CREATE POLICY "Admins can update suggestions"
  ON hours_suggestions FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- 2. STORAGE POLICIES
-- ============================================================

-- storage.objects: "Admins can upload category icons"
DROP POLICY IF EXISTS "Admins can upload category icons" ON storage.objects;
CREATE POLICY "Admins can upload category icons"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'category-icons'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- storage.objects: "Admins can delete category icons"
DROP POLICY IF EXISTS "Admins can delete category icons" ON storage.objects;
CREATE POLICY "Admins can delete category icons"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'category-icons'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- storage.objects: "Admins can update category icons"
DROP POLICY IF EXISTS "Admins can update category icons" ON storage.objects;
CREATE POLICY "Admins can update category icons"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'category-icons'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- 3. UPDATE is_admin_email() FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin_email(check_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT raw_app_meta_data ->> 'role' INTO user_role
  FROM auth.users
  WHERE email = check_email;

  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. ENABLE RLS ON spatial_ref_sys (PostGIS system table)
-- ============================================================
-- NOTE: spatial_ref_sys is owned by the postgres superuser.
-- Run the following manually in the Supabase SQL Editor:
--
--   ALTER TABLE spatial_ref_sys ENABLE ROW LEVEL SECURITY;
--   CREATE POLICY "Allow public read access"
--     ON spatial_ref_sys FOR SELECT USING (true);
