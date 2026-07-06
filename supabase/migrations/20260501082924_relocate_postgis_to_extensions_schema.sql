-- Move PostGIS from public to the extensions schema.
--
-- spatial_ref_sys ships with PostGIS and is owned by supabase_admin, so we
-- can't enable RLS or revoke writes on it from a migration. Relocating the
-- extension to a schema not exposed by PostgREST is the platform-recommended
-- fix. See docs/troubleshooting.md and Supabase ticket SU-363087.
--
-- Safe in this project because no geometry/geography columns exist anywhere;
-- lat/lng are plain decimals and PostGIS is only used by one GIST index and
-- the locations_nearby() function, both recreated below with schema-qualified
-- calls so they no longer depend on a role-specific search_path.

DROP INDEX IF EXISTS public.idx_locations_geography;
DROP FUNCTION IF EXISTS public.locations_nearby(decimal, decimal, integer);

DROP EXTENSION IF EXISTS postgis CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

CREATE INDEX idx_locations_geography
  ON public.locations
  USING GIST (extensions.geography(extensions.ST_MakePoint(longitude, latitude)));

CREATE OR REPLACE FUNCTION public.locations_nearby(
  lat decimal,
  lng decimal,
  radius_meters integer DEFAULT 5000
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  address text,
  latitude decimal,
  longitude decimal,
  distance_meters integer
) AS $$
  SELECT
    l.id,
    l.name,
    l.slug,
    l.address,
    l.latitude,
    l.longitude,
    extensions.ST_Distance(
      extensions.geography(extensions.ST_MakePoint(l.longitude, l.latitude)),
      extensions.geography(extensions.ST_MakePoint(lng, lat))
    )::integer AS distance_meters
  FROM public.locations l
  WHERE extensions.ST_DWithin(
    extensions.geography(extensions.ST_MakePoint(l.longitude, l.latitude)),
    extensions.geography(extensions.ST_MakePoint(lng, lat)),
    radius_meters
  )
  AND l.status = 'approved'
  AND l.deleted_at IS NULL
  ORDER BY distance_meters
$$ LANGUAGE sql STABLE;
