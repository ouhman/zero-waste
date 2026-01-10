-- ================================================================
-- Grant INSERT Permission to Anonymous Users
-- ================================================================
-- Migration: Fix RLS 401 error by granting table-level permissions
-- Created: 2026-01-08
-- Problem: RLS policies define WHAT can be inserted, but anon role
--          needs table-level GRANT to INSERT at all.
-- ================================================================

-- Grant INSERT permission on locations table to anon role
GRANT INSERT ON locations TO anon;

-- Grant INSERT permission on location_categories table to anon role
GRANT INSERT ON location_categories TO anon;

-- Grant usage on sequences (needed for gen_random_uuid() if any sequences are used)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ================================================================
-- Verification Query (run after migration):
-- ================================================================
-- SELECT grantee, privilege_type
-- FROM information_schema.table_privileges
-- WHERE table_name = 'locations'
-- AND grantee = 'anon';
--
-- Expected result: INSERT should be listed
-- ================================================================
