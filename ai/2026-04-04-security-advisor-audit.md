# Supabase Security Advisor Audit — 2026-04-04

## Context

Taskwarrior task: "security vulnerabilities +supabase" — review Supabase Security Advisor findings for both DEV and PROD environments.

## Audit Summary

Full audit of all tables, functions, RLS policies, edge functions, client-side config, and secrets management.

### Already Resolved (prior work)

- **app_metadata migration** (2026-04-01, commit b4a2121): All admin RLS policies and `is_admin_email()` migrated from `user_metadata` to `app_metadata`. This was the critical fix — `user_metadata` is editable by end users.
- **RLS enabled** on all 6 tables: `categories`, `locations`, `location_categories`, `email_verifications`, `auth_rate_limits`, `hours_suggestions`
- **Primary keys** on all tables
- **Edge functions** properly use env vars for secrets, validate inputs, implement CORS allowlisting
- **Client-side** only exposes anon key
- **No leaked secrets** in codebase

### Fixed Today

**SECURITY DEFINER functions missing `SET search_path`** (commit f89f342)

Two functions were flagged by the Security Advisor:
- `check_rate_limit()` — from `20260110113400_admin_auth.sql`
- `is_admin_email()` — from `20260401063550_use_app_metadata_for_admin.sql`

Both were `SECURITY DEFINER` without explicit `search_path`, making them theoretically vulnerable to schema injection (attacker shadows unqualified names via manipulated search path).

**Fix:** Migration `20260404065321_fix_security_definer_search_path.sql` — recreates both functions with `SET search_path = public, pg_temp`.

Deployed to DEV and PROD.

### Not Actionable

- **spatial_ref_sys** (PostGIS system table) — needs RLS enabled manually via SQL Editor since it's owned by postgres superuser. Low risk: read-only SRID reference data. Documented in migration comments.

## Environments Checked

| Environment | Project ID | Security Advisor |
|-------------|------------|-----------------|
| DEV | lccpndhssuemudzpfvvg | Clean after fix |
| PROD | rivleprddnvqgigxjyuc | Clean after fix |
