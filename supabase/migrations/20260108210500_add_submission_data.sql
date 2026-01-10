-- ================================================================
-- Add submission_data Column to email_verifications
-- ================================================================
-- Migration: Store full submission data with verification token
-- Created: 2026-01-08
-- Purpose: Allow verify-submission to create location from stored data
-- ================================================================

-- Add JSONB column to store full submission data
ALTER TABLE email_verifications
ADD COLUMN IF NOT EXISTS submission_data JSONB;

-- Add index for querying by verification status
CREATE INDEX IF NOT EXISTS idx_email_verifications_verified
ON email_verifications(verified_at)
WHERE verified_at IS NULL;

-- ================================================================
-- Verification Query (run after migration):
-- ================================================================
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'email_verifications'
-- AND column_name = 'submission_data';
-- ================================================================
