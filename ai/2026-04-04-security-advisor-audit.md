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

  *Superseded — see 2026-04-22 appendix below. The "low risk, read-only" framing was wrong.*

## Environments Checked

| Environment | Project ID | Security Advisor |
|-------------|------------|-----------------|
| DEV | lccpndhssuemudzpfvvg | Clean after fix |
| PROD | rivleprddnvqgigxjyuc | Clean after fix |

## Appendix — 2026-04-22 re-audit

Triggered by: the Security Advisor kept emailing about `rls_disabled_in_public` on `spatial_ref_sys`. The original audit dismissed this as "not actionable, low risk." Both parts were wrong.

### What changed

**The warning is genuinely exploitable.** An empirical probe against DEV (`scripts/probe-spatial-ref-sys.ts`) confirmed that with only the public anon key, anon can INSERT, UPDATE, and DELETE rows on `spatial_ref_sys`. The grants query shows anon and authenticated each hold `SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER` — all granted by `supabase_admin`.

**Practical impact on this app is smaller than the worst case** because the only PostGIS code path in use is `geography(ST_MakePoint(lng, lat))` + `ST_Distance`/`ST_DWithin`, which PostGIS computes from compiled-in WGS84 constants without consulting `spatial_ref_sys` at runtime. Risk would grow with any future feature using `ST_Transform` or non-4326 SRIDs.

### Why we still can't fix it

`spatial_ref_sys` is owned by `supabase_admin`. Every remediation path we reached returns `42501`:

- `ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY` (CLI and Dashboard SQL Editor)
- `CREATE POLICY …` (also requires ownership)
- `REVOKE INSERT, UPDATE, DELETE, TRUNCATE … FROM anon, authenticated` (blocked — `supabase_admin` is grantor)
- `SET ROLE supabase_admin` (platform-blocked)

The earlier audit's claim that "it can be run manually via SQL Editor" was incorrect — the Editor runs as `postgres`, same as migrations.

### Resolution path

Filed a support ticket (2026-04-22) asking Supabase to enable RLS with a public SELECT policy, revoke the write grants, or relocate the PostGIS extension to the `extensions` schema.

Full context, verification scripts, and post-fix checklist are in [docs/troubleshooting.md](../docs/troubleshooting.md).

### Post-fix checklist (run when Supabase responds)

1. `npx tsx scripts/probe-spatial-ref-sys.ts .env.development` — expect all three write probes denied with `42501`.
2. Same against `.env.production`.
3. Confirm the Security Advisor alert clears in the Dashboard for both projects.
4. Update `docs/troubleshooting.md` with resolution date and what Supabase ran.
