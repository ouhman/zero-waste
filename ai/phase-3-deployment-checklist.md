# Phase 3 Deployment Checklist

## Pre-Deployment

- [x] Code changes completed
- [x] All edge functions modified with security improvements
- [x] Summary document created
- [ ] Review changes with team
- [ ] Test edge function syntax (during deployment)

## Deployment Steps

```bash
# 1. Navigate to supabase directory
cd supabase

# 2. Deploy all modified edge functions
supabase functions deploy submit-location
supabase functions deploy verify-submission
supabase functions deploy enrich-location

# 3. Verify deployment succeeded
# Check Supabase dashboard for function status
```

## Post-Deployment Testing

### 1. CORS Testing

- [ ] Test submission from production: https://map.zerowastefrankfurt.de
  - Open browser DevTools > Network tab
  - Submit a test location
  - Verify no CORS errors

- [ ] Test from localhost during development
  - Run `npm run dev`
  - Submit a test location
  - Verify no CORS errors

### 2. Coordinate Validation Testing

**Test Case 1: Invalid Latitude (too high)**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/submit-location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "name": "Test Location",
    "address": "Test Address",
    "email": "test@example.com",
    "latitude": "100",
    "longitude": "8.6821"
  }'
```
**Expected:** 400 error with "Latitude must be between -90 and 90"

**Test Case 2: Invalid Longitude (too low)**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/submit-location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "name": "Test Location",
    "address": "Test Address",
    "email": "test@example.com",
    "latitude": "50.1109",
    "longitude": "-200"
  }'
```
**Expected:** 400 error with "Longitude must be between -180 and 180"

**Test Case 3: Valid Coordinates**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/submit-location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "name": "Test Location",
    "address": "Test Address",
    "email": "test@example.com",
    "latitude": "50.1109",
    "longitude": "8.6821"
  }'
```
**Expected:** 200 success - verification email sent

### 3. Category UUID Validation Testing

**Note:** These tests can only be done in verify-submission, which requires a valid token from submit-location.

**Test Case 1: Invalid UUID Format**
- Submit location with malformed category UUID
- Verify verification fails with "Invalid category UUID format"

**Test Case 2: Non-Existent Category**
- Submit location with valid UUID that doesn't exist in categories table
- Verify verification fails with "Some categories do not exist"

**Test Case 3: Valid Categories**
- Submit location with existing category UUIDs
- Verify location is created successfully

### 4. Rate Limiting (Already Working)

- [ ] Try logging in 5 times with wrong email
- [ ] Verify 6th attempt shows rate limit error
- [ ] Wait 15 minutes
- [ ] Verify can try again

### 5. Monitor Error Logs

```bash
# Watch Supabase function logs for errors
supabase functions logs submit-location
supabase functions logs verify-submission
supabase functions logs enrich-location
```

Look for:
- Unexpected validation failures
- CORS errors
- Database connection issues
- Coordinate validation rejecting valid data

## Rollback Plan

If critical issues are found:

```bash
# 1. Identify the last working version from git
git log supabase/functions/

# 2. Checkout previous version
git checkout <commit-hash> -- supabase/functions/

# 3. Redeploy
supabase functions deploy submit-location
supabase functions deploy verify-submission
supabase functions deploy enrich-location

# 4. Document issue in GitHub issue tracker
```

## Success Criteria

- [ ] All three edge functions deployed successfully
- [ ] CORS works from production domain
- [ ] CORS works from localhost during development
- [ ] Invalid coordinates are rejected
- [ ] Valid coordinates are accepted
- [ ] Invalid category UUIDs are rejected
- [ ] Valid category UUIDs are accepted
- [ ] No regression in existing functionality
- [ ] Error logs show no unexpected errors
- [ ] Rate limiting still works

## Notes

- Keep this checklist updated as you test
- Document any issues found in ai/phase-3-issues.md
- If all tests pass, mark phase as complete in main plan
