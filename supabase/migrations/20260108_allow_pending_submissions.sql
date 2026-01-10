-- ================================================================
-- Allow Public Submissions (Pending Status)
-- ================================================================
-- Migration: Allow anyone to submit locations with 'pending' status
-- Created: 2026-01-08
-- Purpose: Enable public submissions for moderation
-- ================================================================

-- Allow anyone (including anonymous users) to insert locations with 'pending' status
-- IMPORTANT: Must explicitly specify TO anon, authenticated for RLS to work correctly
CREATE POLICY "Anyone can submit pending locations"
  ON locations FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending');

-- Allow anyone to add categories for their submitted locations
CREATE POLICY "Anyone can add categories to locations"
  ON location_categories FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      WHERE id = location_id
      AND status = 'pending'
    )
  );
