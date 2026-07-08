/**
 * Check (and optionally set) the admin role claim for ONE user, so we can tell why
 * the /bulk-station guard bounces a login. The guard requires
 * `session.user.app_metadata.role === 'admin'`; app_metadata lives in
 * auth.users.raw_app_meta_data and is baked into the JWT at login.
 *
 * Reads service_role from .env.production (same as generate-admin-link.ts).
 *
 *   # read-only: print the role claims for one email
 *   npx ts-node scripts/check-admin-role.ts ouhman@gmail.com
 *
 *   # promote: set app_metadata.role = 'admin' for that user (idempotent)
 *   npx ts-node scripts/check-admin-role.ts ouhman@gmail.com --promote
 *
 * Point at DEV with ENV_FILE=.env.development.
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: process.env.ENV_FILE || '.env.production' })

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2]
const promote = process.argv.includes('--promote')

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the env file')
  process.exit(1)
}
if (!email) {
  console.error('Usage: npx ts-node scripts/check-admin-role.ts <email> [--promote]')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

async function findUser(target: string) {
  let page = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const match = data.users.find(u => u.email?.toLowerCase() === target.toLowerCase())
    if (match) return match
    if (data.users.length < 200) return null
    page++
  }
}

async function main() {
  console.log(`Project: ${url}`)
  const user = await findUser(email)
  if (!user) {
    console.log(`\nNo user with email ${email}. (Nothing to promote — user must exist first.)`)
    process.exit(2)
  }

  const appRole = (user.app_metadata as any)?.role ?? null
  const userRole = (user.user_metadata as any)?.role ?? null
  console.log(`\nUser id:            ${user.id}`)
  console.log(`email confirmed:    ${user.email_confirmed_at ?? user.confirmed_at ?? 'NO'}`)
  console.log(`app_metadata.role:  ${appRole}   <-- guard requires this to equal "admin"`)
  console.log(`user_metadata.role: ${userRole}`)

  if (!promote) {
    if (appRole === 'admin') {
      console.log('\nRole is correct. If login still bounces, the problem is the SESSION/link, not the role.')
    } else {
      console.log('\napp_metadata.role is NOT "admin" -> guard bounces every login. Re-run with --promote to fix.')
    }
    return
  }

  if (appRole === 'admin') {
    console.log('\nAlready admin in app_metadata; nothing to change.')
    return
  }

  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: { ...(user.app_metadata as any), role: 'admin' }
  })
  if (error) throw error
  console.log(`\nPromoted. app_metadata.role is now: ${(data.user.app_metadata as any)?.role}`)
  console.log('Log out fully and request a NEW magic link so the fresh JWT carries the claim.')
}

main().catch(e => { console.error('Failed:', e.message ?? e); process.exit(1) })
