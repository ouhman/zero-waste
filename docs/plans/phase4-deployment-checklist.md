# Phase 4 Deployment Checklist

Quick reference for deploying the email notification feature.

## Pre-Deployment

### 1. Verify AWS SES is configured

```bash
# Check that these secrets are already set
supabase secrets list | grep AWS
```

Expected output:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION

### 2. Set admin email secret

```bash
# Set the admin notification email
supabase secrets set ADMIN_EMAIL=admin@zerowastefrankfurt.de

# Optional: Set SES configuration set for tracking
supabase secrets set SES_CONFIGURATION_SET=zerowaste-config-set
```

### 3. Verify noreply@zerowastefrankfurt.de is verified in SES

```bash
# Check SES verified identities
aws ses list-verified-email-addresses --profile zerowaste-map-deployer
```

Should include `noreply@zerowastefrankfurt.de`

## Deployment

### Deploy Edge Function

```bash
# Deploy only the updated function
supabase functions deploy verify-submission

# Verify deployment
supabase functions list
```

## Post-Deployment Testing

### Test 1: Full submission flow

1. Go to https://map.zerowastefrankfurt.de
2. Submit a new location with your test email
3. Check your email for verification link
4. Click verification link
5. **Expected:** Admin receives notification email at ADMIN_EMAIL

### Test 2: Admin email content

Check admin inbox for email with:
- ✅ Subject: "Neue Einreichung: [Location Name]"
- ✅ From: noreply@zerowastefrankfurt.de
- ✅ Location name in body
- ✅ Submitter email in body
- ✅ Formatted timestamp (German locale)
- ✅ Working link to https://map.zerowastefrankfurt.de/admin/pending

### Test 3: User still receives confirmation

Even if admin email fails, user should get:
- ✅ Verification email after submission
- ✅ Success message after verification
- ✅ Location appears in admin panel as pending

### Test 4: Graceful degradation

```bash
# Temporarily unset admin email
supabase secrets unset ADMIN_EMAIL

# Submit new location
# Expected: Submission succeeds, warning logged, no admin email

# Restore admin email
supabase secrets set ADMIN_EMAIL=admin@zerowastefrankfurt.de
```

## Monitoring

### Check logs for admin notifications

```bash
# View Edge Function logs
supabase functions logs verify-submission --tail

# Look for:
# - "ADMIN_EMAIL not configured" (if missing)
# - "Error sending admin notification" (if SES fails)
# - No errors if everything works
```

### Check SES sending metrics

```bash
# View SES sending statistics
aws ses get-send-statistics --profile zerowaste-map-deployer
```

## Rollback Plan

If admin notifications cause issues:

### Option 1: Disable admin email (quick fix)

```bash
# Unset the admin email secret
supabase secrets unset ADMIN_EMAIL

# Function will continue working, just skip admin notifications
```

### Option 2: Redeploy previous version

```bash
# Checkout previous version
git checkout HEAD~1 supabase/functions/verify-submission/index.ts

# Redeploy
supabase functions deploy verify-submission

# Restore current version when ready
git checkout main supabase/functions/verify-submission/index.ts
```

## Troubleshooting

### Admin email not received

1. **Check secrets are set:**
   ```bash
   supabase secrets list | grep -E "(ADMIN_EMAIL|AWS)"
   ```

2. **Check function logs:**
   ```bash
   supabase functions logs verify-submission --tail
   ```

3. **Check SES sending quota:**
   ```bash
   aws ses get-send-quota --profile zerowaste-map-deployer
   ```

4. **Check SES bounce/complaint:**
   ```bash
   # If admin email bounced, it may be suppressed
   aws ses get-account-sending-enabled --profile zerowaste-map-deployer
   ```

### Email arrives but formatting is wrong

1. Check email client (some clients strip styles)
2. View "original message" or "show HTML source"
3. Test in different email client (Gmail, Outlook, etc.)

### Timestamp not in German locale

This is expected in some environments. The Intl API in Deno may fall back to English if German locale is unavailable. This is cosmetic only.

## Success Criteria

✅ Admin receives email within 1 minute of user verification
✅ Email contains all required information
✅ Link to admin panel works
✅ User submission flow is not blocked by admin email
✅ No errors in function logs (except warning if ADMIN_EMAIL not set)

---

**Last updated:** 2026-01-10
