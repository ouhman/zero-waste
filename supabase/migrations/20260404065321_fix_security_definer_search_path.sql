-- Fix SECURITY DEFINER functions missing SET search_path
-- Without explicit search_path, these functions resolve unqualified names
-- using the caller's search_path, which is a privilege escalation risk.

-- 1. check_rate_limit()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. is_admin_email()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
