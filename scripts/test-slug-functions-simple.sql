-- ================================================================
-- Slug Functions Test Script (Simple Version)
-- ================================================================
-- This script tests the slugify() and generate_unique_slug() functions
-- Run this in Supabase SQL Editor after applying migrations
--
-- Usage: Copy and paste into Supabase SQL Editor and run
-- ================================================================

-- Test slugify() function
SELECT '=== Testing slugify() ===' as section;

SELECT 'Basic ASCII' as test, slugify('Repair Cafe') as result, 'repair-cafe' as expected
UNION ALL
SELECT 'German chars', slugify('Bäckerei Müller'), 'baeckerei-mueller'
UNION ALL
SELECT 'Eszett', slugify('Straße'), 'strasse'
UNION ALL
SELECT 'Multiple umlauts', slugify('Grüße für schöne Äpfel'), 'gruesse-fuer-schoene-aepfel'
UNION ALL
SELECT 'Special chars', slugify('Café & Restaurant!'), 'cafe-restaurant'
UNION ALL
SELECT 'Multiple spaces', slugify('Repair   Café  ---  Frankfurt'), 'repair-cafe-frankfurt'
UNION ALL
SELECT 'Trim hyphens', slugify('---Gramm Genau---'), 'gramm-genau'
UNION ALL
SELECT 'Numbers', slugify('Shop 24/7'), 'shop-24-7'
UNION ALL
SELECT 'Empty string', slugify(''), ''
UNION ALL
SELECT 'Only special', slugify('&&&!!!'), '';

-- Test generate_unique_slug() function
SELECT '=== Testing generate_unique_slug() ===' as section;

SELECT 'Basic generation' as test,
       generate_unique_slug('Repair Café', 'Bockenheim', 'Frankfurt am Main') as result,
       'repair-cafe-frankfurt-am-main-bockenheim' as expected
UNION ALL
SELECT 'Name contains city',
       generate_unique_slug('Windelfrei Frankfurt', 'Bockenheim', 'Frankfurt am Main'),
       'windelfrei-frankfurt-bockenheim'
UNION ALL
SELECT 'Name contains suburb',
       generate_unique_slug('Gramm Bockenheim', 'Bockenheim', 'Frankfurt am Main'),
       'gramm-bockenheim-frankfurt-am-main'
UNION ALL
SELECT 'Name contains both',
       generate_unique_slug('Repair Café Frankfurt Bockenheim', 'Bockenheim', 'Frankfurt am Main'),
       'repair-cafe-frankfurt-bockenheim'
UNION ALL
SELECT 'No suburb',
       generate_unique_slug('Tegut Bad Homburg', '', 'Bad Homburg'),
       'tegut-bad-homburg'
UNION ALL
SELECT 'Name has city, no suburb',
       generate_unique_slug('Alnatura Eschborn', '', 'Eschborn'),
       'alnatura-eschborn'
UNION ALL
SELECT 'Only name',
       generate_unique_slug('Gramm Genau', '', ''),
       'gramm-genau'
UNION ALL
SELECT 'German everywhere',
       generate_unique_slug('Bäckerei Müller', 'Höchst', 'Frankfurt am Main'),
       'baeckerei-mueller-frankfurt-am-main-hoechst';

-- Test collision handling
SELECT '=== Testing collision handling ===' as section;

-- Clean up any test data
DELETE FROM locations WHERE name LIKE 'TEST_Slug_%';

-- Create first test location
INSERT INTO locations (name, city, suburb, latitude, longitude, status)
VALUES ('TEST_Slug_Cafe', 'Frankfurt am Main', 'Bockenheim', 50.1234, 8.6789, 'approved');

-- Check first slug (should not have number)
SELECT 'First slug' as test,
       slug as result,
       'test-slug-cafe-frankfurt-am-main-bockenheim' as expected
FROM locations
WHERE name = 'TEST_Slug_Cafe';

-- Test collision (should return -2)
SELECT 'Second call (collision)' as test,
       generate_unique_slug('TEST_Slug_Cafe', 'Bockenheim', 'Frankfurt am Main') as result,
       'test-slug-cafe-frankfurt-am-main-bockenheim-2' as expected;

-- Create second location (should get -2)
INSERT INTO locations (name, city, suburb, latitude, longitude, status)
VALUES ('TEST_Slug_Cafe', 'Frankfurt am Main', 'Bockenheim', 50.1235, 8.6790, 'approved');

SELECT 'Second location slug' as test,
       slug as result,
       'test-slug-cafe-frankfurt-am-main-bockenheim-2' as expected
FROM locations
WHERE name = 'TEST_Slug_Cafe'
ORDER BY created_at DESC
LIMIT 1;

-- Test third collision (should return -3)
SELECT 'Third call (collision)' as test,
       generate_unique_slug('TEST_Slug_Cafe', 'Bockenheim', 'Frankfurt am Main') as result,
       'test-slug-cafe-frankfurt-am-main-bockenheim-3' as expected;

-- Clean up test data
DELETE FROM locations WHERE name LIKE 'TEST_Slug_%';

SELECT '=== All tests complete! ===' as section;
SELECT 'Review results above - each result should match expected value' as note;
