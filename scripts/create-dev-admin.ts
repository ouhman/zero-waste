/**
 * Create (or promote) an admin user in the DEV Supabase project and print a
 * ready-to-use magic link for local login.
 *
 * DEV email delivery is unreliable (no custom Auth SMTP), so instead of relying
 * on the inbox we generate the magic link server-side and print it. Open the
 * printed link in the browser where `npm run dev` is running to log in.
 *
 * Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.development.
 *
 * Usage:
 *   npx ts-node scripts/create-dev-admin.ts you@example.com
 *   npx ts-node scripts/create-dev-admin.ts you@example.com http://localhost:5173/bulk-station
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// This script targets DEV explicitly. Never point it at production.
dotenv.config({ path: '.env.development' })

const email = process.argv[2]
const redirectTo = process.argv[3] || 'http://localhost:5173/bulk-station'

if (!email) {
  console.error('Usage: npx ts-node scripts/create-dev-admin.ts <email> [redirectTo]')
  process.exit(1)
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.development')
  process.exit(1)
}

// Guardrail: this script is DEV-only. Refuse to run against the PROD project.
const PROD_PROJECT = 'rivleprddnvqgigxjyuc'
if (supabaseUrl.includes(PROD_PROJECT)) {
  console.error('Refusing to run: VITE_SUPABASE_URL points at PRODUCTION. This script is DEV-only.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function findUserByEmail(target: string) {
  // DEV has few users; a single page is plenty.
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  const lower = target.toLowerCase()
  return data.users.find(u => u.email?.toLowerCase() === lower) ?? null
}

async function main() {
  console.log(`Target project: ${supabaseUrl}`)
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
    console.log(`✓ Admin user created (id: ${data.user?.id})`)
  }

  // Generate a magic link without sending an email.
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo }
  })
  if (linkError) throw linkError

  console.log('\nOpen this magic link in the browser running `npm run dev`:\n')
  console.log(linkData.properties?.action_link)
  console.log('')
}

main().catch(err => {
  console.error('Failed:', err.message ?? err)
  process.exit(1)
})
