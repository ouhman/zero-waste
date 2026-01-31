import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { supabase } from '@/lib/supabase'

const SESSION_TIMEOUT_MS = 60 * 60 * 1000 // 1 hour
const STORAGE_KEY = 'admin_last_activity'
const LOGIN_ROUTE = '/bulk-station/login'

function getLastActivity(): number {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? parseInt(stored, 10) : 0
}

// Update activity timestamp (only called from admin pages)
export function updateActivity() {
  localStorage.setItem(STORAGE_KEY, Date.now().toString())
}

// Clear activity on logout
export function clearActivity() {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Admin navigation guard using Vue Router 4's return-based approach.
 * Returns true to allow, false to cancel, or a route to redirect.
 */
export async function adminGuard(
  to: RouteLocationNormalized
): Promise<boolean | RouteLocationRaw> {
  // Allow access to non-admin routes (login page, etc.)
  if (!to.meta.requiresAdmin) {
    return true
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    // No session or error - redirect to login
    if (error || !session) {
      return LOGIN_ROUTE
    }

    // Check if session has timed out due to inactivity
    const lastActivity = getLastActivity()
    if (lastActivity > 0 && Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
      clearActivity()
      await supabase.auth.signOut()
      return LOGIN_ROUTE
    }

    // Verify admin role
    const userRole = session.user.user_metadata?.role
    if (userRole !== 'admin') {
      await supabase.auth.signOut()
      return LOGIN_ROUTE
    }

    // Update activity and allow access
    updateActivity()
    return true
  } catch {
    return LOGIN_ROUTE
  }
}
