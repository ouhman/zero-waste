# Beta Modal Feature Implementation Plan

## Summary

Add a clickable BETA badge that opens a modal with project info and feedback form. Feedback is sent via SES to zerowastehello.u1khz@passmail.net.

## Features

- BETA badge with glow animation (stops after first click)
- Tooltip: "Click to learn more about the project"
- Modal with project explanation and feedback form
- Rate limiting: 1 message per 4 minutes (client + server side)
- Success state after sending
- Dark mode support throughout

---

## Phase 1: BETA Badge Enhancement

**File:** `src/views/MapView.vue`

### Changes:
1. Wrap BETA `<sup>` in a `<button>` with click handler
2. Add tooltip via `title` attribute
3. Add conditional glow animation class
4. Track "has clicked" state in localStorage (`betaModalClicked`)
5. Add CSS keyframes for subtle pulse glow

### New state:
```typescript
const hasBetaClicked = ref(localStorage.getItem('betaModalClicked') === 'true')
const showBetaModal = ref(false)
```

### Glow CSS:
```css
@keyframes betaGlow {
  0%, 100% { text-shadow: 0 0 4px rgba(34, 197, 94, 0.4); }
  50% { text-shadow: 0 0 8px rgba(34, 197, 94, 0.8), 0 0 12px rgba(34, 197, 94, 0.4); }
}
.beta-glow { animation: betaGlow 2s ease-in-out infinite; }
```

---

## Phase 2: BetaModal Component

**File:** `src/components/BetaModal.vue` (new)

### Pattern to follow:
- `src/components/ShareModal.vue` (Teleport, transitions, ESC handler)

### Structure:
- Props: `isOpen: boolean`
- Emits: `close`
- Teleport to body
- Backdrop with fade transition, z-[1003]
- Modal content with scale transition, z-[1004]
- ESC key handler with cleanup

### Content sections:
1. **Header:** "Welcome, fellow zero waste adventurer"
2. **Body:**
   - Beta status explanation
   - What this is (map for Frankfurt)
   - Why we're building (side project, evenings after work)
   - "Every small step matters. Even the tiny ones."
3. **Feedback form:**
   - Message textarea (required, min 10 chars)
   - Email input (optional)
   - Submit button with loading state
4. **Success state:** Thank you message, auto-close option
5. **Rate limit state:** Show countdown timer

### States:
- `default` - Show form
- `submitting` - Loading spinner
- `success` - Thank you message
- `rateLimited` - Show remaining time

### Modal copy (approved):

```
Welcome, fellow zero waste adventurer

We haven't launched publicly yet, so you're getting a sneak peek. Things might break or behave strangely. Bear with us.

What is this?

A map to help you find sustainable shops, refill stations, and zero waste spots in Frankfurt. We're starting local but we have bigger plans.

Why we're building this

We want to make the zero waste journey less overwhelming. Finding the right places shouldn't be hard. And we believe that if people share what they know, everyone benefits.

This is a side project, built in the evenings after work. Progress happens when life allows, but we're committed to it.

Every small step matters. Even the tiny ones.

---

Found something broken? Have an idea?

We actually want to hear about it.

[Your message]

[Email] (only if you want a reply)

[Send]

---

Thanks for being here.
```

---

## Phase 3: useFeedback Composable

**File:** `src/composables/useFeedback.ts` (new)

### Pattern to follow:
- `src/composables/useHoursSuggestion.ts`

### Exports:
```typescript
export function useFeedback() {
  return {
    isSubmitting: Ref<boolean>,
    error: Ref<string | null>,
    rateLimitExceeded: Ref<boolean>,
    rateLimitRemaining: Ref<number>,  // seconds
    submitFeedback: (message: string, email?: string) => Promise<{success: boolean}>,
    checkRateLimit: () => boolean
  }
}
```

### Rate limit:
- localStorage key: `lastFeedbackSubmit`
- Window: 240 seconds (4 minutes)
- Check before API call, update on success

---

## Phase 4: send-feedback Edge Function

**File:** `supabase/functions/send-feedback/index.ts` (new)

### Pattern to follow:
- `supabase/functions/submit-location/index.ts`

### Features:
- CORS headers (same allowed origins)
- Rate limiting via in-memory Map (IP-based, 4 min window)
- Input validation (message required, min 10 chars)
- SES email to: `zerowastehello.u1khz@passmail.net`
- From: `noreply@zerowastefrankfurt.de`

### Email format:
- Subject: "Feedback: Zero Waste Frankfurt"
- HTML + plain text versions
- Include: timestamp, message, email (if provided)
- German locale date formatting

### Response codes:
- 200: Success
- 400: Validation error
- 429: Rate limited
- 500: Server error

---

## Phase 5: i18n Translations

**Files:**
- `src/locales/de.json`
- `src/locales/en.json`

### Keys to add under `"beta"`:
- tooltip
- title, subtitle, description
- whyBuilding, whyBuildingText
- feedbackTitle, feedbackPlaceholder, emailPlaceholder
- submit
- successTitle, successMessage
- rateLimitTitle, rateLimitMessage
- messageRequired

---

## Phase 6: Testing

### Component tests for BetaModal:
- Renders when isOpen=true
- Closes on backdrop click
- Closes on ESC key
- Form validation (message required)
- Shows rate limit state
- Shows success state

### E2E test (optional):
- BETA badge click opens modal
- Glow stops after click
- Feedback submission flow

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/views/MapView.vue` |
| Create | `src/components/BetaModal.vue` |
| Create | `src/composables/useFeedback.ts` |
| Create | `supabase/functions/send-feedback/index.ts` |
| Modify | `src/locales/de.json` |
| Modify | `src/locales/en.json` |

---

## Deployment

After implementation:
```bash
# Deploy edge function
supabase functions deploy send-feedback

# No new secrets needed - uses existing AWS SES credentials
```
