-- Rate limiting table for login attempts
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  attempts INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auth_rate_limits_email ON auth_rate_limits(email);

-- Function to check rate limit (5 attempts per 15 minutes)
CREATE OR REPLACE FUNCTION check_rate_limit(check_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rate_record RECORD;
  max_attempts INTEGER := 5;
  window_minutes INTEGER := 15;
BEGIN
  SELECT * INTO rate_record
  FROM auth_rate_limits
  WHERE email = check_email
    AND first_attempt_at > NOW() - INTERVAL '15 minutes';

  IF NOT FOUND THEN
    -- Clean old records and create new
    DELETE FROM auth_rate_limits WHERE email = check_email;
    INSERT INTO auth_rate_limits (email) VALUES (check_email);
    RETURN TRUE;
  END IF;

  IF rate_record.blocked_until IS NOT NULL AND rate_record.blocked_until > NOW() THEN
    RETURN FALSE;
  END IF;

  IF rate_record.attempts >= max_attempts THEN
    UPDATE auth_rate_limits
    SET blocked_until = NOW() + INTERVAL '15 minutes'
    WHERE email = check_email;
    RETURN FALSE;
  END IF;

  UPDATE auth_rate_limits
  SET attempts = attempts + 1
  WHERE email = check_email;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for rate limits (only authenticated admins can view)
ALTER TABLE auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view rate limits"
  ON auth_rate_limits FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
