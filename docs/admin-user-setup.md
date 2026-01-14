# Admin User Setup for Production

This guide explains how to create an admin user in the production Supabase project.

## Prerequisites

- Access to Supabase Dashboard
- Production project URL: https://rivleprddnvqgigxjyuc.supabase.co

## Steps

### 1. Create User in Supabase Dashboard

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select the **zerowaste-map-production** project
3. Navigate to **Authentication** → **Users**
4. Click **Add User** → **Create new user**
5. Fill in the form:
   - **Email:** `admin@zerowastefrankfurt.de` (or your admin email)
   - **Password:** (Auto-generate or set a strong password)
   - **Auto Confirm User:** ✅ Check this box
6. Click **Create User**
7. **Save the password securely** (if auto-generated)

### 2. Set Admin Role via SQL

1. In the Supabase Dashboard, navigate to **SQL Editor**
2. Click **New Query**
3. Paste the following SQL:

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@zerowastefrankfurt.de';
```

4. **Replace the email** with the actual admin email you used in step 1
5. Click **Run** or press `Ctrl/Cmd + Enter`
6. Verify the output shows: `UPDATE 1`

### 3. Verify Admin Access

1. Go to the production site: https://map.zerowastefrankfurt.de
2. Navigate to `/admin/login`
3. Enter the admin email address
4. Check your email for the magic link
5. Click the magic link to log in
6. Verify you can access:
   - `/admin` - Dashboard
   - `/admin/locations` - Location management
   - `/admin/categories` - Category management

### 4. Security Notes

- **Never commit admin credentials** to version control
- **Use a strong, unique password** if using password auth
- **Enable 2FA** if available (future enhancement)
- **Limit admin access** to authorized personnel only
- **Regularly review** admin user list

## Troubleshooting

### "Unauthorized" when accessing admin pages

**Cause:** The `role` metadata wasn't set correctly.

**Solution:** Re-run the SQL query from Step 2 and verify:

```sql
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'admin@zerowastefrankfurt.de';
```

Expected output: `role: admin`

### Magic link not received

**Cause:** Email might be in spam, or SES configuration issue.

**Solution:**
1. Check spam/junk folder
2. Verify SES configuration in AWS
3. Check Edge Function logs: `npx supabase functions logs submit-location`
4. Use password login as fallback (if configured)

### Can't create user in dashboard

**Cause:** Email might already exist.

**Solution:**
1. Check existing users: **Authentication** → **Users**
2. If user exists, just update the role via SQL (Step 2)
3. If user is deleted, restore or use a different email

## Multiple Admin Users

To create additional admin users, repeat steps 1-3 with different email addresses.

## Removing Admin Access

To revoke admin access:

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}',
  '"user"'
)
WHERE email = 'former-admin@example.com';
```

Or delete the user entirely:

1. **Authentication** → **Users**
2. Find the user
3. Click the **...** menu → **Delete User**
