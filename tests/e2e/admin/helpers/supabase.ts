// Direct Supabase client for test operations
// - Seed test data
// - Cleanup after tests
// - Bypass RLS with service role key

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../../../src/types/database'

const supabaseUrl = process.env.TEST_SUPABASE_URL!
const supabaseServiceKey = process.env.TEST_SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing TEST_SUPABASE_URL or TEST_SUPABASE_SERVICE_KEY environment variables. ' +
    'Please create a .env.test file with these variables.'
  )
}

// Create client with service role key to bypass RLS
export const testSupabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

// Helper to check if we're connected to DEV environment
export const isTestEnvironmentValid = () => {
  return supabaseUrl.includes('lccpndhssuemudzpfvvg')
}

// SECURITY: Hard block if not pointing at DEV environment
// This prevents accidentally running tests against production
if (!isTestEnvironmentValid()) {
  throw new Error(
    '\n🛑 SECURITY BLOCK: TEST_SUPABASE_URL does not point to DEV project!\n' +
    'E2E tests must ONLY run against DEV environment.\n' +
    'Expected: https://lccpndhssuemudzpfvvg.supabase.co\n' +
    `Got: ${supabaseUrl}\n`
  )
}
