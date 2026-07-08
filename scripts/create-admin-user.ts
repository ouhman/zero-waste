/**
 * Create (or promote) an admin user in a Supabase project and print a ready-to-use
 * magic link. Defaults to PRODUCTION (.env.production); this is the prod-capable
 * sibling of create-dev-admin.ts (which refuses to touch prod).
 *
 * A new user is created email-confirmed with app_metadata.role='admin' so the
 * magic-link login flow (which requires app_metadata.role, see is_admin_email and
 * the router guard) works immediately. app_metadata can only be set server-side.
 *
 * Reads VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from the env file.
 *
 *   npx ts-node scripts/create-admin-user.ts pia.fourcadier@gmail.com
 *   ENV_FILE=.env.development npx ts-node scripts/create-admin-user.ts you@example.com
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

const envFile = process.env.ENV_FILE || '.env.production'
dotenv.config({ path: envFile })

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2]
const redirectTo = process.argv[3] || 'https://map.zerowastefrankfurt.de/bulk-station'

if (!url || !key) {
  console.error(`Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in ${envFile}`)
  process.exit(1)
}
if (!email) {
  console.error('Usage: npx ts-node scripts/create-admin-user.ts <email> [redirectTo]')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function findUserByEmail(target: string) {
  const lower = target.toLowerCase()
  let page = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const match = data.users.find(u => u.email?.toLowerCase() === lower)
    if (match) return match
    if (data.users.length < 200) return null
    page++
  }
}

async function main() {
  console.log(`Target project: ${url}`)
  console.log(`Admin email:    ${email}`)

  const existing = await findUserByEmail(email)

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      app_metadata: { ...existing.app_metadata, role: 'admin' }
    })
    if (error) throw error
    console.log(`✓ Existing user promoted to admin (id: ${existing.id})`)
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      app_metadata: { role: 'admin' }
    })
    if (error) throw error
    console.log(`✓ Admin user created, email confirmed (id: ${data.user?.id})`)
  }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo }
  })
  if (linkError) throw linkError

  console.log('\nReady-to-use magic link (one-time, ~1h; opens the admin dashboard):\n')
  console.log(linkData.properties?.action_link)
  console.log('')
}

main().catch(err => {
  console.error('Failed:', err.message ?? err)
  process.exit(1)
})
