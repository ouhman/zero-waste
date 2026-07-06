#!/bin/bash
#
# Switch the Supabase "Magic Link" email template to emit a 6-digit code
# ({{ .Token }}) instead of a magic link ({{ .ConfirmationURL }}), so admin
# login delivers an OTP code that verifyOtp() checks in-app.
#
# signInWithOtp(email) renders the project's "Magic Link" template, so this is
# the server-side switch that pairs with the client change in LoginView.vue
# (commit 30b717a). It must be applied per hosted project (DEV and PROD each
# have their own template).
#
# Run it yourself so your access token never leaves your machine:
#     ! bash scripts/set-otp-email-template.sh
#
# Token resolution order:
#   1. $SUPABASE_ACCESS_TOKEN (export it if you prefer:
#      generate one at https://supabase.com/dashboard/account/tokens)
#   2. the token the Supabase CLI already stored in your keyring
#
# Only PATCHes the two magic-link fields; all other auth config is left as-is.
# Prints HTTP status codes only, never the token or the config response body.

set -euo pipefail

DEV_REF="lccpndhssuemudzpfvvg"
PROD_REF="rivleprddnvqgigxjyuc"

SUBJECT="Your Zero Waste Frankfurt login code"
read -r -d '' TEMPLATE <<'HTML' || true
<h2>Your login code</h2>
<p>Enter this 6-digit code to sign in:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:3px">{{ .Token }}</p>
<p>This code expires in 1 hour. If you didn't request it, ignore this email.</p>
HTML

# --- Resolve access token -------------------------------------------------
TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
if [ -z "$TOKEN" ] && command -v secret-tool >/dev/null 2>&1; then
    TOKEN=$(secret-tool lookup service "Supabase CLI" username "access-token" 2>/dev/null || true)
fi
if [ -z "$TOKEN" ]; then
    echo "No access token found."
    echo "Either:  export SUPABASE_ACCESS_TOKEN=sbp_...   (https://supabase.com/dashboard/account/tokens)"
    echo "or make sure 'supabase login' has run so the CLI stored it in your keyring."
    exit 1
fi

# --- Requires jq for safe JSON encoding of the HTML -----------------------
if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required (safe JSON encoding of the template). Install jq and retry."
    exit 1
fi

BODY=$(jq -n --arg subj "$SUBJECT" --arg body "$TEMPLATE" \
    '{mailer_subjects_magic_link: $subj, mailer_templates_magic_link_content: $body}')

patch_project() {
    local ref="$1" name="$2"
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X PATCH "https://api.supabase.com/v1/projects/${ref}/config/auth" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "$BODY")
    if [ "$code" = "200" ]; then
        echo "  ✓ ${name} (${ref}): updated (HTTP ${code})"
    else
        echo "  ✗ ${name} (${ref}): FAILED (HTTP ${code})"
    fi
}

echo "Setting Magic Link template to 6-digit code ({{ .Token }})..."
patch_project "$DEV_REF"  "DEV"
patch_project "$PROD_REF" "PROD"
echo "Done. Request a new login code to verify you now receive digits, not a link."
