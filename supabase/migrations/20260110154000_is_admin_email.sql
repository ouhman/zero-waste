-- Function to check if an email belongs to an admin user
-- Returns true if email exists and has admin role, false otherwise
-- This is used to prevent sending magic links to non-admin emails
-- while not revealing whether an email is an admin or not
CREATE OR REPLACE FUNCTION is_admin_email(check_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT raw_user_meta_data ->> 'role' INTO user_role
  FROM auth.users
  WHERE email = check_email;

  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon role (needed for login page)
GRANT EXECUTE ON FUNCTION is_admin_email(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION is_admin_email(TEXT) TO authenticated;
