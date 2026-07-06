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
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'),
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
4. Check your email for the 6-digit login code
5. Enter the code to log in
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

## Login email delivery

Admin login uses a **6-digit email OTP**, not a magic link. `signInWithOtp` sends the code and `verifyOtp` checks it in-app (see `src/views/admin/LoginView.vue`). Two independent things must **both** be true for the code email to arrive, and each has its own failure mode. Both bit us at once during rollout — the template still sent a link *and* the address wasn't SES-verified — so if admin login "does nothing", check both before anything else.

### 1. The email template must emit a code, not a link

Supabase renders the project's **Magic Link** template for `signInWithOtp` emails. If it contains the default `{{ .ConfirmationURL }}`, the admin receives a clickable link instead of a code. It must use `{{ .Token }}`:

Dashboard → **Authentication** → **Emails** → **Templates** → **Magic Link**:

```html
<h2>Your login code</h2>
<p>Enter this 6-digit code to sign in:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:3px">{{ .Token }}</p>
<p>This code expires in 1 hour. If you didn't request it, ignore this email.</p>
```

This is a per-project setting — **DEV and PROD each have their own template**. Apply it to both at once with the helper script (uses the Supabase Management API; run it yourself so your access token stays local):

```bash
bash scripts/set-otp-email-template.sh
```

### 2. The recipient must be a deliverable SES identity

Supabase auth emails are relayed through AWS SES (custom SMTP). **SES is in sandbox mode**, so mail is only delivered to **verified** identities — an admin whose address isn't verified in SES gets *no email at all*. In the UI this is indistinguishable from "nothing happened" (the login flow is deliberately enumeration-safe and always advances to the code step). Fixes:

- Verify the admin's address in SES: AWS Console → SES → **Verified identities** → **Create identity** → **Email address**, then click the link SES sends, **or**
- Request SES production access to lift the sandbox restriction entirely.

See [aws-ses.md](aws-ses.md) for SES setup and sandbox details.

## Troubleshooting

### "Unauthorized" when accessing admin pages

**Cause:** The `role` metadata wasn't set correctly.

**Solution:** Re-run the SQL query from Step 2 and verify:

```sql
SELECT email, raw_app_meta_data->>'role' as role
FROM auth.users
WHERE email = 'admin@zerowastefrankfurt.de';
```

Expected output: `role: admin`

### Login code not received (or arrives as a link)

Admin login is a 6-digit OTP code, not a magic link. The two most common causes map to the two requirements in [Login email delivery](#login-email-delivery):

1. **You get a link, not a code** → the Magic Link template still uses `{{ .ConfirmationURL }}`. Switch it to `{{ .Token }}` (run `scripts/set-otp-email-template.sh`).
2. **No email at all** → the address isn't a verified SES identity (SES is in sandbox). Verify it in SES or request production access — see [aws-ses.md](aws-ses.md).
3. **Otherwise** → check spam/junk, and confirm the project's auth SMTP points at SES (Authentication → Emails → SMTP Settings). Note: auth emails go through Supabase Auth's SMTP, *not* the `submit-location` edge function, so edge-function logs won't show them.

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
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'),
  '{role}',
  '"user"'
)
WHERE email = 'former-admin@example.com';
```

Or delete the user entirely:

1. **Authentication** → **Users**
2. Find the user
3. Click the **...** menu → **Delete User**
