# Phase 2: Edge Function Secrets Setup Guide

**Status:** ⚠️ ACTION REQUIRED
**Estimated time:** 5 minutes

## Overview

The production Supabase project Edge Functions need AWS SES credentials to send verification emails. These secrets must be manually configured.

## Required Secrets

| Secret Name | Value Source | Purpose |
|-------------|--------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS SSM or DEV project | SES authentication |
| `AWS_SECRET_ACCESS_KEY` | AWS SSM or DEV project | SES authentication |
| `AWS_REGION` | `eu-central-1` | SES region |

**Note:** `FROM_EMAIL` is hardcoded in the Edge Function as `noreply@zerowastefrankfurt.de`, so it doesn't need to be set as a secret.

## Option 1: Copy from DEV Project (Recommended)

### Step 1: Get secrets from DEV project

```bash
# Link to DEV project
npx supabase link --project-ref lccpndhssuemudzpfvvg

# List secrets (shows hashes only, not actual values)
npx supabase secrets list
```

**Current DEV secrets:**
- ✅ AWS_ACCESS_KEY_ID (set)
- ✅ AWS_SECRET_ACCESS_KEY (set)
- ✅ AWS_REGION (set to eu-central-1)

### Step 2: Retrieve actual values

The actual secret values are stored in AWS Systems Manager Parameter Store:

```bash
# Set AWS profile
export AWS_PROFILE=zerowaste-map-deployer

# Get AWS Access Key ID
aws ssm get-parameter \
  --name "/zerowaste/ses/access-key-id" \
  --with-decryption \
  --query "Parameter.Value" \
  --output text

# Get AWS Secret Access Key
aws ssm get-parameter \
  --name "/zerowaste/ses/secret-access-key" \
  --with-decryption \
  --query "Parameter.Value" \
  --output text
```

**Fallback:** If you don't have AWS CLI access, you can:
1. Check the `infra/` CDK code for parameter names
2. Access AWS Console → Systems Manager → Parameter Store
3. Or create new IAM credentials for SES (see Option 2)

### Step 3: Set secrets in production

```bash
# Link to production project
npx supabase link --project-ref rivleprddnvqgigxjyuc

# Set secrets (replace <values> with actual values from Step 2)
npx supabase secrets set AWS_ACCESS_KEY_ID=<value-from-ssm>
npx supabase secrets set AWS_SECRET_ACCESS_KEY=<value-from-ssm>
npx supabase secrets set AWS_REGION=eu-central-1
```

### Step 4: Verify

```bash
# List secrets (should show all three)
npx supabase secrets list --project-ref rivleprddnvqgigxjyuc
```

Expected output:
```
NAME                      | DIGEST
--------------------------|------------------------------------------------------------------
AWS_ACCESS_KEY_ID         | <hash>
AWS_REGION                | <hash>
AWS_SECRET_ACCESS_KEY     | <hash>
SUPABASE_ANON_KEY         | <hash>
SUPABASE_DB_URL           | <hash>
SUPABASE_SERVICE_ROLE_KEY | <hash>
SUPABASE_URL              | <hash>
```

## Option 2: Create New IAM Credentials (If Needed)

If you can't retrieve existing credentials:

### Step 1: Create IAM user (via CDK or Console)

The CDK already created a user. Check outputs:

```bash
cd /home/ouhman/projects/zerowaste-frankfurt/infra
export AWS_PROFILE=zerowaste-map-deployer
npx cdk deploy ZeroWasteEmailStack --outputs-file outputs.json
```

Or create manually in AWS Console:
1. IAM → Users → Create User
2. Attach policy: `AmazonSESFullAccess` (or custom policy with `ses:SendEmail`)
3. Create access keys → Save credentials

### Step 2: Store in SSM (optional, for consistency)

```bash
export AWS_PROFILE=zerowaste-map-deployer

# Store credentials
aws ssm put-parameter \
  --name "/zerowaste/ses/access-key-id" \
  --value "AKIA..." \
  --type "SecureString" \
  --overwrite

aws ssm put-parameter \
  --name "/zerowaste/ses/secret-access-key" \
  --value "..." \
  --type "SecureString" \
  --overwrite
```

### Step 3: Set in Supabase

Same as Option 1, Step 3.

## Testing Edge Functions

After setting secrets, test the Edge Functions:

### Test submit-location

```bash
# Get production API URL
PROD_URL="https://rivleprddnvqgigxjyuc.supabase.co"
ANON_KEY="<your-prod-anon-key>"

# Submit test location
curl -X POST "$PROD_URL/functions/v1/submit-location" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Location",
    "address": "Teststraße 1",
    "city": "Frankfurt am Main",
    "latitude": 50.1109,
    "longitude": 8.6821,
    "category_ids": [],
    "email": "test@example.com"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

### Check Edge Function logs

```bash
npx supabase link --project-ref rivleprddnvqgigxjyuc
npx supabase functions logs submit-location --tail
```

Look for:
- ✅ "Sending verification email to test@example.com"
- ✅ "Email sent successfully"
- ❌ No AWS credential errors

### Test email delivery

1. Check your test email inbox
2. Look for "Verify Your Location Submission"
3. Click verification link
4. Should redirect to success page

If email doesn't arrive:
- Check AWS SES → Configuration → Email Addresses (must be verified in sandbox mode)
- Check CloudWatch Logs for SES errors
- Verify secrets are set correctly

## Troubleshooting

### Error: "Missing AWS credentials"

```bash
# Verify secrets are set
npx supabase secrets list
```

Should show `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`.

### Error: "Email address is not verified"

AWS SES is in sandbox mode. Only verified email addresses can receive emails.

**Solution:**
1. AWS Console → Amazon SES → Verified Identities
2. Create Identity → Email Address → Enter recipient email
3. Verify email from AWS
4. Test again

**Production solution:**
Request production access for SES (allows sending to any email).

### Error: "InvalidParameterValue: Missing required header 'To'"

Check Edge Function code has correct email field mapping.

### Secrets not taking effect

Secrets are injected at function runtime. After setting secrets:
1. No need to redeploy functions
2. Just invoke the function again
3. New invocations will use new secrets

## Security Notes

- Never commit AWS credentials to git
- Store in SSM Parameter Store with encryption
- Use least-privilege IAM policy (only `ses:SendEmail`)
- Rotate credentials periodically
- Same credentials used for DEV and PROD (acceptable for MVP)

## Next Steps

After secrets are configured:
- ✅ Mark Phase 2 as complete
- ✅ Create storage bucket (see phase2-completion-report.md)
- ✅ Proceed to Phase 3: Data Migration

---

**Created:** 2026-01-14
**Updated:** 2026-01-14
