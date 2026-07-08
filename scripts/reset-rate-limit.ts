/**
 * Reset the admin-login rate limiter ("zu viele Versuche"). check_rate_limit()
 * allows 5 attempts / 15 min per email then blocks for 15 min; this clears the
 * counter rows so the next attempt is allowed immediately.
 *
 * Reads service_role from .env.production (bypasses RLS). Pass an email to clear
 * just that address, or no arg to clear the whole (transient) table.
 *
 *   npx ts-node scripts/reset-rate-limit.ts ouhman@gmail.com
 *   npx ts-node scripts/reset-rate-limit.ts            # clear all
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: process.env.ENV_FILE || '.env.production' })

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2]

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

async function main() {
  console.log(`Project: ${url}`)
  const query = supabase.from('auth_rate_limits').delete({ count: 'exact' })
  const { error, count } = email
    ? await query.eq('email', email)
    : await query.neq('email', '') // match all rows
  if (error) throw error
  console.log(`Cleared ${count ?? '?'} rate-limit row(s)${email ? ` for ${email}` : ''}.`)
}

main().catch(e => { console.error('Failed:', e.message ?? e); process.exit(1) })
