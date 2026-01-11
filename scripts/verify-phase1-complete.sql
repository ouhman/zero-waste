-- ================================================================
-- Phase 1 Verification Script
-- ================================================================
-- Run this script to verify that Phase 1 migrations were applied
-- successfully and all database objects exist.
--
-- Usage: Copy and paste into Supabase SQL Editor
-- ================================================================

SELECT '=== Verifying Phase 1 Implementation ===' as section;

-- Check 1: Suburb column exists
SELECT
  '1. Suburb column' as check,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'locations'
        AND column_name = 'suburb'
        AND data_type = 'text'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL - Column not found'
  END as status;

-- Check 2: Slugify function exists
SELECT
  '2. slugify() function' as check,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_proc
      WHERE proname = 'slugify'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL - Function not found'
  END as status;

-- Check 3: Generate unique slug function exists
SELECT
  '3. generate_unique_slug() function' as check,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_proc
      WHERE proname = 'generate_unique_slug'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL - Function not found'
  END as status;

-- Check 4: Trigger function exists
SELECT
  '4. trigger_generate_location_slug() function' as check,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_proc
      WHERE proname = 'trigger_generate_location_slug'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL - Function not found'
  END as status;

-- Check 5: Trigger exists on locations table
SELECT
  '5. locations_generate_slug trigger' as check,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.triggers
      WHERE trigger_name = 'locations_generate_slug'
        AND event_object_table = 'locations'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL - Trigger not found'
  END as status;

-- Check 6: Old function removed
SELECT
  '6. Old generate_location_slug() removed' as check,
  CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM pg_proc
      WHERE proname = 'generate_location_slug'
    ) THEN '✓ PASS'
    ELSE '✗ WARN - Old function still exists'
  END as status;

-- Check 7: Suburb index exists
SELECT
  '7. idx_locations_suburb index' as check,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE indexname = 'idx_locations_suburb'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL - Index not found'
  END as status;

-- Functional tests
SELECT '=== Running Functional Tests ===' as section;

-- Test 8: Slugify basic test
SELECT
  '8. slugify() basic test' as check,
  CASE
    WHEN slugify('Bäckerei Müller') = 'baeckerei-mueller'
    THEN '✓ PASS'
    ELSE '✗ FAIL - Got: ' || slugify('Bäckerei Müller')
  END as status;

-- Test 9: Generate unique slug basic test
SELECT
  '9. generate_unique_slug() basic test' as check,
  CASE
    WHEN generate_unique_slug('Test Café', 'Nordend', 'Frankfurt am Main')
         = 'test-cafe-frankfurt-am-main-nordend'
    THEN '✓ PASS'
    ELSE '✗ FAIL - Got: ' || generate_unique_slug('Test Café', 'Nordend', 'Frankfurt am Main')
  END as status;

-- Test 10: Deduplication test
SELECT
  '10. Deduplication test' as check,
  CASE
    WHEN generate_unique_slug('Windelfrei Frankfurt', 'Bockenheim', 'Frankfurt am Main')
         = 'windelfrei-frankfurt-bockenheim'
    THEN '✓ PASS'
    ELSE '✗ FAIL - Got: ' || generate_unique_slug('Windelfrei Frankfurt', 'Bockenheim', 'Frankfurt am Main')
  END as status;

-- Summary
SELECT '=== Verification Summary ===' as section;

SELECT
  'Total Checks: 10' as summary,
  CASE
    WHEN (
      -- Count passing checks
      SELECT COUNT(*)
      FROM (
        -- Repeat all checks (abbreviated for summary)
        SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'suburb') THEN 1 ELSE 0 END as pass
        UNION ALL SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'slugify') THEN 1 ELSE 0 END
        UNION ALL SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_unique_slug') THEN 1 ELSE 0 END
        UNION ALL SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_generate_location_slug') THEN 1 ELSE 0 END
        UNION ALL SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'locations_generate_slug') THEN 1 ELSE 0 END
        UNION ALL SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_location_slug') THEN 1 ELSE 0 END
        UNION ALL SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_locations_suburb') THEN 1 ELSE 0 END
        UNION ALL SELECT CASE WHEN slugify('Bäckerei Müller') = 'baeckerei-mueller' THEN 1 ELSE 0 END
        UNION ALL SELECT CASE WHEN generate_unique_slug('Test Café', 'Nordend', 'Frankfurt am Main') = 'test-cafe-frankfurt-am-main-nordend' THEN 1 ELSE 0 END
        UNION ALL SELECT CASE WHEN generate_unique_slug('Windelfrei Frankfurt', 'Bockenheim', 'Frankfurt am Main') = 'windelfrei-frankfurt-bockenheim' THEN 1 ELSE 0 END
      ) checks
      WHERE pass = 1
    ) = 10
    THEN 'Status: ✓ ALL TESTS PASSED - Phase 1 Complete!'
    ELSE 'Status: ✗ SOME TESTS FAILED - Review output above'
  END as result;

SELECT '=== Next Steps ===' as section;
SELECT 'If all checks passed, you can proceed to Phase 2: Nominatim Suburb Extraction' as instruction
UNION ALL
SELECT 'Run scripts/test-slug-functions-simple.sql for comprehensive testing' as instruction;
