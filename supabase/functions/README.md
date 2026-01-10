# Supabase Edge Functions

This directory contains Deno-based Edge Functions for the Zero Waste Frankfurt application.

## Functions

### `submit-location`

Handles location submission requests from users.

**Endpoint:** `POST /functions/v1/submit-location`

**Request Body:**
```json
{
  "name": "Location Name",
  "address": "Full Address",
  "city": "Frankfurt",
  "postal_code": "60311",
  "latitude": "50.1109",
  "longitude": "8.6821",
  "email": "user@example.com",
  "submission_type": "new",
  "description_de": "Optional description",
  "website": "https://example.com",
  "categories": ["cafe", "shop"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

**What it does:**
1. Validates required fields
2. Generates a unique verification token
3. Stores verification record in `email_verifications` table
4. Sends verification email to user (TODO: integrate email service)

### `verify-submission`

Verifies email tokens and creates location records.

**Endpoint:** `POST /functions/v1/verify-submission`

**Request Body:**
```json
{
  "token": "uuid-token-here"
}
```

**Response:**
```json
{
  "success": true,
  "status": "pending",
  "message": "Submission verified and pending review"
}
```

**What it does:**
1. Validates token exists and hasn't expired
2. Marks verification as complete
3. Creates location record with status "pending" (TODO)
4. Returns success message

## Deployment

### Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link to your project:
```bash
supabase link --project-ref your-project-ref
```

### Deploy Functions

Deploy a specific function:
```bash
supabase functions deploy submit-location
supabase functions deploy verify-submission
```

Deploy all functions:
```bash
supabase functions deploy
```

### Environment Variables

Set environment variables in Supabase Dashboard:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for verify-submission)
- `FRONTEND_URL` - Your frontend URL (for verification links)
- `DENO_ENV` - Set to "development" for testing

Or via CLI:
```bash
supabase secrets set FRONTEND_URL=https://map.zerowastefrankfurt.de
```

## Local Development

Run functions locally:

```bash
# Start Supabase locally
supabase start

# Serve a specific function
supabase functions serve submit-location --env-file .env.local

# Serve all functions
supabase functions serve --env-file .env.local
```

Test with curl:

```bash
# Test submit-location
curl -i --location --request POST 'http://localhost:54321/functions/v1/submit-location' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"name":"Test","address":"Test St","latitude":"50.1","longitude":"8.6","email":"test@example.com","submission_type":"new"}'

# Test verify-submission
curl -i --location --request POST 'http://localhost:54321/functions/v1/verify-submission' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"token":"test-token-uuid"}'
```

## TODO for Production

### Email Integration

Choose an email service provider:

**Option 1: Resend (recommended)**
- Simple API
- Good deliverability
- Generous free tier

```typescript
// In submit-location/index.ts
import { Resend } from 'npm:resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

await resend.emails.send({
  from: 'noreply@zerowastefrankfurt.de',
  to: submissionData.email,
  subject: 'Bestätigen Sie Ihre Einreichung',
  html: `
    <p>Bitte bestätigen Sie Ihre Einreichung:</p>
    <a href="${verificationUrl}">Bestätigen</a>
  `
})
```

**Option 2: Postmark**
- Excellent deliverability
- Transactional email focus

**Option 3: SendGrid**
- Popular choice
- More complex setup

### Store Submission Data

Currently the submission data isn't stored with the verification token. Add a JSON column or separate table:

```sql
-- Option 1: Add JSON column to email_verifications
ALTER TABLE email_verifications ADD COLUMN submission_data JSONB;

-- Option 2: Create pending_submissions table
CREATE TABLE pending_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verification_id UUID REFERENCES email_verifications(id),
  submission_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Then in `verify-submission/index.ts`, retrieve the data and create the location record.

### Security Considerations

1. **Rate Limiting:** Add rate limiting to prevent abuse
2. **Input Validation:** Validate all input thoroughly
3. **Token Expiration:** Tokens expire after 24 hours (already implemented)
4. **Email Verification:** Only verified emails can submit locations

## Monitoring

View function logs in Supabase Dashboard:
- Go to Edge Functions section
- Select function
- View Logs tab

Or via CLI:
```bash
supabase functions logs submit-location
```

## Testing

The Edge Functions are tested indirectly through the frontend integration tests in:
- `tests/integration/submission-flow.test.ts`
- `tests/unit/composables/useSubmission.test.ts`

For direct testing, use the curl commands above or create a test script.
