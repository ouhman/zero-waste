-- ================================================================
-- Slug Functions Test Script
-- ================================================================
-- This script tests the slugify() and generate_unique_slug() functions
-- Run this in Supabase SQL Editor after applying migrations
--
-- Usage:
--   1. Apply all slug migrations
--   2. Run this script
--   3. Verify all tests show expected results
-- ================================================================

\echo '================================================================'
\echo 'Testing slugify() function'
\echo '================================================================'

-- Test 1: Basic ASCII text
SELECT 'Test 1 (Basic ASCII):' as test,
       slugify('Repair Cafe') as result,
       'repair-cafe' as expected;

-- Test 2: German characters (ä→ae, ö→oe, ü→ue, ß→ss)
SELECT 'Test 2 (German chars):' as test,
       slugify('Bäckerei Müller') as result,
       'baeckerei-mueller' as expected;

-- Test 3: Eszett (ß→ss)
SELECT 'Test 3 (Eszett):' as test,
       slugify('Straße') as result,
       'strasse' as expected;

-- Test 4: Multiple umlauts
SELECT 'Test 4 (Multiple umlauts):' as test,
       slugify('Grüße für schöne Äpfel') as result,
       'gruesse-fuer-schoene-aepfel' as expected;

-- Test 5: Special characters and spaces
SELECT 'Test 5 (Special chars):' as test,
       slugify('Café & Restaurant!') as result,
       'cafe-restaurant' as expected;

-- Test 6: Multiple consecutive spaces/hyphens
SELECT 'Test 6 (Multiple spaces):' as test,
       slugify('Repair   Café  ---  Frankfurt') as result,
       'repair-cafe-frankfurt' as expected;

-- Test 7: Leading and trailing hyphens
SELECT 'Test 7 (Trim hyphens):' as test,
       slugify('---Gramm Genau---') as result,
       'gramm-genau' as expected;

-- Test 8: Numbers should be preserved
SELECT 'Test 8 (Numbers):' as test,
       slugify('Shop 24/7') as result,
       'shop-24-7' as expected;

-- Test 9: Empty string
SELECT 'Test 9 (Empty string):' as test,
       slugify('') as result,
       '' as expected;

-- Test 10: Only special characters
SELECT 'Test 10 (Only special):' as test,
       slugify('&&&!!!') as result,
       '' as expected;

\echo ''
\echo '================================================================'
\echo 'Testing generate_unique_slug() function'
\echo '================================================================'

-- Clean up test data
DELETE FROM locations WHERE name LIKE 'TEST_%';

-- Test 11: Basic slug generation (city before suburb)
SELECT 'Test 11 (Basic generation):' as test,
       generate_unique_slug('Repair Café', 'Bockenheim', 'Frankfurt am Main') as result,
       'repair-cafe-frankfurt-am-main-bockenheim' as expected;

-- Test 12: Deduplication - name contains city
SELECT 'Test 12 (Name contains city):' as test,
       generate_unique_slug('Windelfrei Frankfurt', 'Bockenheim', 'Frankfurt am Main') as result,
       'windelfrei-frankfurt-bockenheim' as expected;

-- Test 13: Deduplication - name contains suburb
SELECT 'Test 13 (Name contains suburb):' as test,
       generate_unique_slug('Gramm Bockenheim', 'Bockenheim', 'Frankfurt am Main') as result,
       'gramm-bockenheim-frankfurt-am-main' as expected;

-- Test 14: Deduplication - name contains both
SELECT 'Test 14 (Name contains both):' as test,
       generate_unique_slug('Repair Café Frankfurt Bockenheim', 'Bockenheim', 'Frankfurt am Main') as result,
       'repair-cafe-frankfurt-bockenheim' as expected;

-- Test 15: No suburb (fallback to city only)
SELECT 'Test 15 (No suburb):' as test,
       generate_unique_slug('Tegut Bad Homburg', '', 'Bad Homburg') as result,
       'tegut-bad-homburg' as expected;

-- Test 16: Name contains city, no suburb
SELECT 'Test 16 (Name has city, no suburb):' as test,
       generate_unique_slug('Alnatura Eschborn', '', 'Eschborn') as result,
       'alnatura-eschborn' as expected;

-- Test 17: Empty city and suburb (edge case)
SELECT 'Test 17 (Only name):' as test,
       generate_unique_slug('Gramm Genau', '', '') as result,
       'gramm-genau' as expected;

-- Test 18: German characters in all parts
SELECT 'Test 18 (German everywhere):' as test,
       generate_unique_slug('Bäckerei Müller', 'Höchst', 'Frankfurt am Main') as result,
       'baeckerei-mueller-frankfurt-am-main-hoechst' as expected;

\echo ''
\echo '================================================================'
\echo 'Testing collision handling'
\echo '================================================================'

-- Create first location with a slug
INSERT INTO locations (name, city, suburb, latitude, longitude, status)
VALUES ('TEST_Cafe', 'Frankfurt am Main', 'Bockenheim', 50.1234, 8.6789, 'approved');

-- Test 19: First slug should not have number
SELECT 'Test 19 (First slug):' as test,
       slug as result,
       'test-cafe-frankfurt-am-main-bockenheim' as expected
FROM locations
WHERE name = 'TEST_Cafe';

-- Test 20: Second call should increment
SELECT 'Test 20 (Collision increment):' as test,
       generate_unique_slug('TEST_Cafe', 'Bockenheim', 'Frankfurt am Main') as result,
       'test-cafe-frankfurt-am-main-bockenheim-2' as expected;

-- Create second location with same base slug
INSERT INTO locations (name, city, suburb, latitude, longitude, status)
VALUES ('TEST_Cafe', 'Frankfurt am Main', 'Bockenheim', 50.1235, 8.6790, 'approved');

-- Test 21: Second location should have -2
SELECT 'Test 21 (Second location):' as test,
       slug as result,
       'test-cafe-frankfurt-am-main-bockenheim-2' as expected
FROM locations
WHERE name = 'TEST_Cafe'
ORDER BY created_at DESC
LIMIT 1;

-- Test 22: Third call should increment to -3
SELECT 'Test 22 (Third collision):' as test,
       generate_unique_slug('TEST_Cafe', 'Bockenheim', 'Frankfurt am Main') as result,
       'test-cafe-frankfurt-am-main-bockenheim-3' as expected;

-- Clean up test data
DELETE FROM locations WHERE name LIKE 'TEST_%';

\echo ''
\echo '================================================================'
\echo 'All tests complete!'
\echo 'Review results above - each test should match expected output'
\echo '================================================================'
