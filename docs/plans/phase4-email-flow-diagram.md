# Email Notification Flow - Phase 4

## Complete User Submission Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER SUBMITS LOCATION                       │
│                   (via Frontend Form)                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│           Edge Function: submit-location                         │
│  1. Validate submission data                                     │
│  2. Generate verification token                                  │
│  3. Store in email_verifications table                           │
│  4. Send verification email to USER via AWS SES                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   USER RECEIVES EMAIL                            │
│  Subject: "Bestätigen Sie Ihre Einreichung: [Location]"         │
│  Body: Verification link with token                              │
│  From: noreply@zerowastefrankfurt.de                             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  USER CLICKS LINK                                │
│         (https://map.../verify?token=...)                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│           Edge Function: verify-submission                       │
│  1. Validate token (not expired, not used)                       │
│  2. Retrieve submission_data from email_verifications            │
│  3. Create location record (status: pending)                     │
│  4. Add categories to location_categories                        │
│  5. Mark verification as complete (verified_at)                  │
│  6. ⭐ NEW: Send notification to ADMIN via AWS SES               │
│     (wrapped in try/catch - non-blocking)                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ├──────────────────┬──────────────────────────┐
                      ▼                  ▼                          ▼
        ┌──────────────────┐ ┌──────────────────┐    ┌──────────────────┐
        │ USER SEES        │ │ ADMIN RECEIVES   │    │ LOCATION CREATED │
        │ SUCCESS          │ │ EMAIL            │    │ IN DATABASE      │
        │ MESSAGE          │ │                  │    │ (status=pending) │
        └──────────────────┘ └──────────────────┘    └──────────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │   Admin Email Content    │
                         ├──────────────────────────┤
                         │ Subject: "Neue           │
                         │   Einreichung: [Name]"   │
                         │                          │
                         │ Body:                    │
                         │ - Location name          │
                         │ - Submitter email        │
                         │ - Timestamp (German)     │
                         │ - Link to /admin/pending │
                         │                          │
                         │ From:                    │
                         │ noreply@...de            │
                         │                          │
                         │ To:                      │
                         │ $ADMIN_EMAIL             │
                         └──────────────────────────┘
```

## Error Handling

```
                 ┌─────────────────────────┐
                 │ Admin Email Send Failed │
                 │ (SES error, network,    │
                 │  invalid email, etc.)   │
                 └──────────┬──────────────┘
                            │
                            ▼
                 ┌─────────────────────────┐
                 │ Error caught by         │
                 │ try/catch block         │
                 └──────────┬──────────────┘
                            │
                            ▼
                 ┌─────────────────────────┐
                 │ Log error:              │
                 │ "Error sending admin    │
                 │  notification: ..."     │
                 └──────────┬──────────────┘
                            │
                            ▼
                 ┌─────────────────────────┐
                 │ Continue execution      │
                 │ Return success to user  │
                 │ Location still created  │
                 └─────────────────────────┘
```

## Missing ADMIN_EMAIL Flow

```
                 ┌─────────────────────────┐
                 │ ADMIN_EMAIL env var     │
                 │ not set                 │
                 └──────────┬──────────────┘
                            │
                            ▼
                 ┌─────────────────────────┐
                 │ Check returns undefined │
                 └──────────┬──────────────┘
                            │
                            ▼
                 ┌─────────────────────────┐
                 │ Log warning:            │
                 │ "ADMIN_EMAIL not        │
                 │  configured - skipping" │
                 └──────────┬──────────────┘
                            │
                            ▼
                 ┌─────────────────────────┐
                 │ Return early            │
                 │ No email sent           │
                 │ No error thrown         │
                 └─────────────────────────┘
```

## Future: Approval/Rejection Emails (Phase 5)

```
┌─────────────────────────────────────────────────────────────────┐
│                   ADMIN REVIEWS LOCATION                         │
│              (in Admin Panel - /admin/pending)                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
              ┌───────┴────────┐
              │                │
              ▼                ▼
    ┌──────────────┐  ┌──────────────┐
    │   APPROVE    │  │    REJECT    │
    └───────┬──────┘  └───────┬──────┘
            │                 │
            ▼                 ▼
    ┌──────────────┐  ┌──────────────┐
    │ Update:      │  │ Update:      │
    │ status =     │  │ status =     │
    │ 'approved'   │  │ 'rejected'   │
    └───────┬──────┘  └───────┬──────┘
            │                 │
            ▼                 ▼
    ┌──────────────┐  ┌──────────────┐
    │ Send email   │  │ Send email   │
    │ using        │  │ using        │
    │ getApproval  │  │ getRejection │
    │ Email        │  │ Email        │
    │ Template()   │  │ Template()   │
    └───────┬──────┘  └───────┬──────┘
            │                 │
            ▼                 ▼
    ┌──────────────┐  ┌──────────────┐
    │ USER receives│  │ USER receives│
    │ approval     │  │ rejection    │
    │ confirmation │  │ notification │
    │ (DE/EN)      │  │ with reason  │
    │              │  │ (DE/EN)      │
    └──────────────┘  └──────────────┘

Note: Templates ready, integration pending Phase 5
```

## Email Template Functions

```typescript
// Admin notification (German only)
getAdminNotificationTemplate(
  locationName: string,
  submitterEmail: string,
  submittedAt: string,      // ISO 8601
  adminPanelUrl: string
): EmailTemplate

// Approval notification (bilingual)
getApprovalEmailTemplate(
  locationName: string,
  locale: 'de' | 'en' = 'de'
): EmailTemplate

// Rejection notification (bilingual)
getRejectionEmailTemplate(
  locationName: string,
  reason: string,
  locale: 'de' | 'en' = 'de'
): EmailTemplate
```

## EmailTemplate Interface

```typescript
interface EmailTemplate {
  subject: string    // Email subject line
  html: string       // HTML version (styled)
  text: string       // Plain text version (fallback)
}
```

---

**Legend:**
- ⭐ = New functionality added in Phase 4
- Future = Templates ready, implementation in Phase 5
