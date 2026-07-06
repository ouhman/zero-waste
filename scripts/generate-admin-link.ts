/**
 * Generate an admin magic-link login URL server-side — no email is sent, so it is
 * immune to email rate limits and to link-scanners pre-consuming the token. Use
 * this to log in when email delivery is throttled or links keep arriving "dead".
 *
 * Credentials are read from the gitignored .env.production so no secret ever
 * appears on the command line or in your shell history. Add this one line to
 * .env.production (get the value from Supabase Dashboard -> Settings -> API ->
 * "service_role" secret; treat it like a password):
 *
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role secret>
 *
 * Then run:
 *   npx ts-node scripts/generate-admin-link.ts ouhman@gmail.com
 *
 * Point it at a different env file with ENV_FILE=.env.development, and override the
 * post-login redirect with a second argument if needed.
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: process.env.ENV_FILE || '.env.production' })

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2]
const redirectTo = process.argv[3] || 'https://map.zerowastefrankfurt.de/bulk-station'

if (!url || !key) {
  console.error(
    'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the env file ' +
    `(${process.env.ENV_FILE || '.env.production'}).\n` +
    'Add:  SUPABASE_SERVICE_ROLE_KEY=<service_role secret from Dashboard -> Settings -> API>'
  )
  process.exit(1)
}
if (!email) {
  console.error('Usage: npx ts-node scripts/generate-admin-link.ts <email> [redirectTo]')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

async function main() {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo }
  })
  if (error) throw error

  console.log(`\nProject:  ${url}`)
  console.log(`Redirect: ${redirectTo}`)
  console.log('\nOpen this link in your browser to log in (one-time, use promptly):\n')
  console.log(data.properties?.action_link)
  console.log('')
}

main().catch(e => { console.error('Failed:', e.message ?? e); process.exit(1) })
