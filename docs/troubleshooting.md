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

### Status

Open with Supabase support. Subject: `Cannot enable RLS on public.spatial_ref_sys — owned by supabase_admin, confirmed exploitable on 2 projects`. Requested actions (any one resolves it):

1. Enable RLS and add a `FOR SELECT TO anon, authenticated USING (true)` policy on `spatial_ref_sys` for both projects.
2. Revoke `INSERT, UPDATE, DELETE, TRUNCATE` from `anon` and `authenticated` on `spatial_ref_sys` (keeping `SELECT`).
3. Relocate the PostGIS extension to the `extensions` schema (requires a maintenance window).

### When support acts

1. Rerun `scripts/probe-spatial-ref-sys.ts` against DEV and PROD — all write probes should flip to `42501 denied`.
2. Confirm the Security Advisor alert clears in the Dashboard.
3. Update this section to note resolution date and what Supabase ran.
