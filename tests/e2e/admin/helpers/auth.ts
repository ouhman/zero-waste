// Auth bypass using Supabase signInWithPassword
// Creates a real session that can be validated by the app

import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { TEST_ADMIN } from '../fixtures/test-data'

const supabaseUrl = process.env.TEST_SUPABASE_URL!
const supabaseAnonKey = process.env.TEST_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('Missing TEST_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing TEST_SUPABASE_ANON_KEY environment variable. ' +
    'Add it to .env.test (get it from Supabase Dashboard → Settings → API)'
  )
}

// Create a client with anon key for sign-in (not service role)
const authClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

interface SessionData {
  access_token: string
  refresh_token: string
  expires_at: number
  expires_in: number
  token_type: string
  user: {
    id: string
    email: string
    user_metadata: Record<string, unknown>
  }
}

/**
 * Sign in as test admin and get a real session
 */
export async function createTestAdminSession(): Promise<SessionData> {
  const { data, error } = await authClient.auth.signInWithPassword({
    email: TEST_ADMIN.email,
    password: TEST_ADMIN.password,
  })

  if (error) {
    throw new Error(`Failed to sign in as test admin: ${error.message}`)
  }

  if (!data.session) {
    throw new Error('No session returned from sign in')
  }

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at!,
    expires_in: data.session.expires_in,
    token_type: data.session.token_type,
    user: {
      id: data.user.id,
      email: data.user.email!,
      user_metadata: data.user.user_metadata,
    },
  }
}

/**
 * Inject session into browser localStorage before page loads
 */
export async function injectSession(page: Page, session: SessionData): Promise<void> {
  // The key format is: sb-{project-ref}-auth-token
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || 'lccpndhssuemudzpfvvg'
  const storageKey = `sb-${projectRef}-auth-token`

  await page.addInitScript(
    ({ key, sessionData }) => {
      localStorage.setItem(key, JSON.stringify(sessionData))

      // Also set last activity for session management
      localStorage.setItem('admin_last_activity', String(Date.now()))
    },
    { key: storageKey, sessionData: session }
  )
}

/**
 * Convenience function to login as admin in one call
 * Use this in test beforeEach hooks
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  const session = await createTestAdminSession()
  await injectSession(page, session)
}
