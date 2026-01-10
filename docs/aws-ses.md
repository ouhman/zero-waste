# AWS SES Email Setup

This document covers setting up AWS SES (Simple Email Service) for email verification in Zero Waste Frankfurt.

## Overview

AWS SES is used to send verification emails when users submit new locations. The infrastructure is managed via AWS CDK.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Supabase Edge  │────▶│    AWS SES       │────▶│  User's Inbox   │
│    Function     │     │  (eu-central-1)  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │
        │ Uses IAM credentials
        ▼
┌─────────────────┐
│  IAM User       │
│  (zerowaste-    │
│   ses-user)     │
└─────────────────┘
```

## CDK Infrastructure

The SES stack is defined in `infra/lib/email-stack.ts` and creates:

1. **SES Email Identity** - Domain verification for `zerowastefrankfurt.de`
2. **IAM User** - `zerowaste-ses-user` with `ses:SendEmail` permission
3. **Access Keys** - Stored in SSM Parameter Store

## Setup Steps

### 1. Deploy CDK Stack

```bash
cd infra

# Install dependencies
npm install

# Deploy the email stack
npx cdk deploy ZeroWasteEmailStack
```

### 2. Verify Domain in SES

After deployment, add the DKIM CNAME records to your DNS:

1. Go to AWS Console → SES → Verified identities
2. Click on `zerowastefrankfurt.de`
3. Copy the 3 DKIM CNAME records
4. Add them to your DNS provider

Example DKIM records:
```
Name: abc123._domainkey.zerowastefrankfurt.de
Type: CNAME
Value: abc123.dkim.amazonses.com
```

### 3. Request Production Access

SES starts in **sandbox mode** - you can only send to verified emails.

To send to any email:
1. Go to AWS Console → SES → Account dashboard
2. Click "Request production access"
3. Fill out the form (use case: transactional emails for location verification)
4. Wait for approval (usually 24-48 hours)

### 4. Get IAM Credentials

```bash
# Get Access Key ID
aws ssm get-parameter --name /zerowaste/ses/access-key-id --query 'Parameter.Value' --output text

# Get Secret Access Key
aws ssm get-parameter --name /zerowaste/ses/secret-access-key --query 'Parameter.Value' --output text
```

### 5. Set Supabase Secrets

```bash
supabase secrets set AWS_ACCESS_KEY_ID=AKIA...
supabase secrets set AWS_SECRET_ACCESS_KEY=...
supabase secrets set AWS_REGION=eu-central-1
supabase secrets set FRONTEND_URL=https://map.zerowastefrankfurt.de
```

### 6. Deploy Edge Functions

```bash
supabase functions deploy submit-location
supabase functions deploy verify-submission
```

## Testing

### In Sandbox Mode

While in sandbox mode, verify test email addresses:

1. Go to AWS Console → SES → Verified identities
2. Click "Create identity"
3. Select "Email address"
4. Enter your test email
5. Click verification link in email

### Test Submission

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/submit-location' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test Location",
    "address": "Test Street 1",
    "latitude": "50.12",
    "longitude": "8.69",
    "email": "your-verified-email@example.com",
    "submission_type": "new"
  }'
```

## Cost

AWS SES pricing (eu-central-1):
- **Free tier**: 62,000 emails/month (when sent from EC2)
- **Standard**: $0.10 per 1,000 emails
- **Data transfer**: $0.12 per GB (first 10 TB)

For this app's expected volume (< 100 submissions/month), cost is essentially $0.

## Troubleshooting

### Email not sending

1. Check Edge Function logs:
   ```bash
   supabase functions logs submit-location
   ```

2. Verify SES credentials are set:
   ```bash
   supabase secrets list
   ```

3. Check domain is verified in SES console

### "Email address is not verified" error

This means you're still in sandbox mode. Either:
- Verify the recipient email in SES
- Request production access

### DKIM verification failing

- DNS propagation can take up to 72 hours
- Verify CNAME records are correct (no trailing dots)
- Check with: `dig +short abc123._domainkey.zerowastefrankfurt.de CNAME`

## Security Considerations

1. **IAM Permissions**: The IAM user can only send emails from `zerowastefrankfurt.de`
2. **Credentials**: Stored encrypted in SSM Parameter Store and Supabase secrets
3. **Rate Limiting**: Consider adding rate limiting to prevent abuse
4. **Input Validation**: Email addresses are validated before sending

## Files

| File | Purpose |
|------|---------|
| `infra/lib/email-stack.ts` | CDK stack for SES resources |
| `supabase/functions/submit-location/index.ts` | Sends verification emails |
| `supabase/functions/verify-submission/index.ts` | Processes email verification |
