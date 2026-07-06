# Troubleshooting

Known issues that can't be fully resolved in-repo, along with the context needed to pick them up later.

## Supabase Security Advisor: `rls_disabled_in_public` on `spatial_ref_sys`

### Symptom

Supabase's Security Advisor emails a critical-severity alert for both our projects:

> Table `public.spatial_ref_sys` is public, but RLS has not been enabled.

### Is it real?

Yes. Empirically confirmed on the DEV project using only the public anon key: `anon` can `INSERT`, `UPDATE`, and `DELETE` rows on `spatial_ref_sys`, and `authenticated` additionally holds `TRUNCATE`. Worst-case attack is a `DELETE` or `TRUNCATE` that wipes the EPSG reference data. Practical impact on this app is small because the only PostGIS code path in use is `geography(ST_MakePoint(lng, lat))` + `ST_Distance` / `ST_DWithin`, which PostGIS computes from compiled-in WGS84 constants and does not consult `spatial_ref_sys` at runtime. Risk is higher for any future feature that uses `ST_Transform` or non-4326 SRIDs.

### Why we can't fix it from migrations

`spatial_ref_sys` is owned by `supabase_admin`, not `postgres`. This is Supabase platform behaviour — when `CREATE EXTENSION postgis` runs on a managed project, the extension's objects are owned by the platform role so Supabase can upgrade them. Verify with:

```sql
select c.relname, pg_get_userbyid(c.relowner) as owner
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by owner, relname;
```

All app tables show `owner = postgres`. Only `spatial_ref_sys` shows `owner = supabase_admin`.

All remediation paths require that ownership and fail with `42501`:

| Attempt | Where | Result |
| --- | --- | --- |
| `ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY` | `supabase db push` | `must be owner of table spatial_ref_sys` |
| Same statement | Dashboard SQL Editor | Same error |
| `CREATE POLICY … ON public.spatial_ref_sys …` | Either | Same error (policy creation also requires ownership) |
| `REVOKE INSERT, UPDATE, DELETE, TRUNCATE … FROM anon, authenticated` | Either | Blocked — `supabase_admin` is the grantor |
| `SET ROLE supabase_admin` | SQL Editor | `permission denied to set role "supabase_admin"` |

Fix 2 from the advisor docs (unexpose the `public` schema) isn't viable for this project — our app tables live in `public` and must be reachable through PostgREST.

### Verification script

`scripts/probe-spatial-ref-sys.ts` tests whether `anon` can still write to `spatial_ref_sys`. Run against DEV or PROD:

```bash
npx tsx scripts/probe-spatial-ref-sys.ts .env.development
npx tsx scripts/probe-spatial-ref-sys.ts .env.production
```

After Supabase applies the fix, all three write probes (`INSERT`, `UPDATE`, `DELETE`) should return `42501` denied. Currently they all succeed — that's the open vulnerability. The script is safe to rerun on PROD: writes target a non-colliding probe SRID and clean up after themselves.

### Resolution

Supabase support (ticket `SU-363087`, replied 2026-04-30) pointed at the documented manual relocation in [their PostGIS troubleshooting guide](https://supabase.com/docs/guides/database/extensions/postgis#troubleshooting): drop the extension and reinstall it in the `extensions` schema, which PostgREST does not expose. Safe for this project because we have no geometry/geography columns — lat/lng are plain decimals and the only PostGIS dependents are one GIST index and `locations_nearby()`, both recreated with `extensions.`-qualified calls.

Migration: `supabase/migrations/20260501082924_relocate_postgis_to_extensions_schema.sql`.

| Date | Project | Status |
| --- | --- | --- |
| 2026-05-01 | DEV (`lccpndhssuemudzpfvvg`) | Resolved — probe writes return `PGRST205 table not found`; advisor alert cleared |
| 2026-05-01 | PROD (`rivleprddnvqgigxjyuc`) | Resolved — probe writes return `PGRST205 table not found`; `locations_nearby()` returning 207 results post-fix |

After the migration, `scripts/probe-spatial-ref-sys.ts` reports the secure terminal state (table no longer exposed by PostgREST). To prevent recurrence, see the [Extension placement](supabase.md#extension-placement) rule — every `CREATE EXTENSION` must include `WITH SCHEMA extensions`.

## Admin login OTP email: arrives as a link, or never arrives

### Symptom

An admin enters their email at `/admin/login` but either receives a **magic link instead of a 6-digit code**, or **no email at all** — login appears to do nothing.

### Cause

Two requirements live outside the repo (Supabase dashboard + AWS SES) and failed together during the OTP rollout:

1. **Template** — `signInWithOtp` renders Supabase's **Magic Link** email template. If it still emits the default `{{ .ConfirmationURL }}`, the admin gets a link, not a code. It must emit `{{ .Token }}`. Per-project setting; apply to DEV and PROD with `scripts/set-otp-email-template.sh`.
2. **Delivery** — auth mail relays through AWS SES in **sandbox mode**, so the recipient must be a **verified SES identity** or nothing is delivered.

### Fix

Full runbook — including the template HTML and the SES verification steps — is in [admin-user-setup.md#login-email-delivery](admin-user-setup.md#login-email-delivery).
