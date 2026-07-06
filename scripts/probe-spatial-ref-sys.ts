/**
 * Spatial Ref Sys Security Probe
 *
 * Empirically tests whether the anon role can read/write public.spatial_ref_sys,
 * to determine if the Supabase Security Advisor "rls_disabled_in_public" warning
 * is exploitable on this project.
 *
 * Two passing terminal states (both exit 0):
 *   - "relocated"    public.spatial_ref_sys does not exist (PostGIS now in
 *                    extensions). PostgREST returns PGRST205 for every probe.
 *                    This is the post-fix state — see docs/troubleshooting.md.
 *   - "read-only"    Table still in public, but writes are denied (42501).
 *
 * Failing terminal state (exit 1):
 *   - any write probe succeeds — anon can mutate spatial_ref_sys.
 *
 * Probes:
 *   1. SELECT existing row              — detects which terminal state we're in
 *   2. INSERT a probe row (SRID 998888) — the critical write test
 *   3. UPDATE that probe row
 *   4. DELETE that probe row            — also serves as cleanup
 *
 * Usage:
 *   npx tsx scripts/probe-spatial-ref-sys.ts [.env.development|.env.production]
 *
 * Exit codes:
 *   0 — secure (relocated or read-only).
 *   1 — anon can write. Advisor warning is real. Investigate.
 *   2 — script setup error.
 */

import dotenv from 'dotenv'
import { createClient, type PostgrestError } from '@supabase/supabase-js'

const envFile = process.argv[2] ?? '.env.development'
dotenv.config({ path: envFile })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(`error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing from ${envFile}`)
  process.exit(2)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// SRID 998888: within the spatial_ref_sys_srid_check range (0 < srid <= 998999)
// and far outside any real EPSG code — safe to create and delete.
const PROBE_SRID = 998888

type Expect = 'success' | 'denied'

interface ProbeResult {
  label: string
  expect: Expect
  passed: boolean
  detail: string
}

function classify(
  label: string,
  expect: Expect,
  error: PostgrestError | null,
  data: unknown,
): ProbeResult {
  const actual: Expect = error ? 'denied' : 'success'
  const passed = actual === expect
  const detail = error
    ? `code=${error.code ?? '?'} message="${(error.message ?? '').slice(0, 140)}"`
    : `data=${JSON.stringify(data).slice(0, 140)}`
  return { label, expect, passed, detail }
}

async function main() {
  console.log(`Probing ${SUPABASE_URL} as anon role`)
  console.log(`(anon key sourced from ${envFile}, not printed)\n`)

  const results: ProbeResult[] = []
  let insertSucceeded = false

  // 1. SELECT — detects which terminal state we're in.
  //    PGRST205 means PostGIS has been relocated; the table is no longer
  //    exposed via PostgREST. Anything else means it's still in public, in
  //    which case the SELECT itself should succeed.
  let relocated = false
  {
    const { data, error } = await supabase
      .from('spatial_ref_sys')
      .select('srid')
      .limit(1)
    relocated = error?.code === 'PGRST205'
    results.push(
      classify(
        'SELECT  read one EPSG row',
        relocated ? 'denied' : 'success',
        error,
        data,
      ),
    )
  }

  // 2. INSERT — the critical test. Uses a valid-range, non-colliding SRID.
  //    If anon lacks INSERT grant → code=42501. If it succeeds → a row exists.
  {
    const { data, error } = await supabase
      .from('spatial_ref_sys')
      .insert({
        srid: PROBE_SRID,
        auth_name: 'PROBE',
        auth_srid: PROBE_SRID,
        srtext: 'probe',
        proj4text: 'probe',
      })
      .select()
    results.push(classify(`INSERT  create SRID ${PROBE_SRID}`, 'denied', error, data))
    insertSucceeded = !error && Array.isArray(data) && data.length > 0
  }

  // 3. UPDATE — modifies the probe row we just inserted (if INSERT succeeded).
  //    If INSERT failed, this targets a non-existent row and we can't distinguish
  //    permission-denied from no-match, so we report accordingly.
  {
    const { data, error } = await supabase
      .from('spatial_ref_sys')
      .update({ auth_name: 'PROBE_UPDATED' })
      .eq('srid', PROBE_SRID)
      .select()
    results.push(classify(`UPDATE  modify SRID ${PROBE_SRID}`, 'denied', error, data))
  }

  // 4. DELETE — removes the probe row. Doubles as partial cleanup.
  {
    const { data, error } = await supabase
      .from('spatial_ref_sys')
      .delete()
      .eq('srid', PROBE_SRID)
      .select()
    results.push(classify(`DELETE  drop SRID ${PROBE_SRID}`, 'denied', error, data))
  }

  for (const r of results) {
    const tag = r.passed ? '[PASS]' : '[FAIL]'
    console.log(`  ${tag}  ${r.label}  (expected ${r.expect})`)
    console.log(`         ${r.detail}`)
  }

  // Belt-and-braces cleanup: try once more to remove the probe row. If INSERT
  // succeeded but DELETE didn't, this is our fallback to avoid leaving state.
  if (insertSucceeded) {
    const { error } = await supabase
      .from('spatial_ref_sys')
      .delete()
      .eq('srid', PROBE_SRID)
    if (error) {
      console.log(`\n⚠ FINAL CLEANUP FAILED: probe row SRID ${PROBE_SRID} may still exist.`)
      console.log(`  error: ${error.code} ${error.message}`)
      console.log(`  Remove manually via the Supabase SQL Editor:`)
      console.log(`    DELETE FROM public.spatial_ref_sys WHERE srid = ${PROBE_SRID};`)
    } else {
      console.log(`\n(final cleanup: SRID ${PROBE_SRID} confirmed removed)`)
    }
  }

  const failed = results.filter((r) => !r.passed)
  console.log()
  if (failed.length > 0) {
    console.log(`RESULT: ${failed.length} probe(s) deviated from "denied" expectation.`)
    console.log(`Anon role can write to public.spatial_ref_sys.`)
    console.log(`The advisor "rls_disabled_in_public" warning IS exploitable on this project.`)
    process.exit(1)
  }
  if (relocated) {
    console.log('RESULT: public.spatial_ref_sys is not exposed by PostgREST.')
    console.log('PostGIS has been relocated to the extensions schema (post-fix state).')
  } else {
    console.log('RESULT: anon is read-only on spatial_ref_sys.')
    console.log('Advisor warning is templated; table-level GRANTs block writes.')
  }
}

main().catch((err) => {
  console.error('Probe script error:', err)
  process.exit(2)
})
