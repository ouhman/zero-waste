import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { supabase } from '@/lib/supabase'

const SESSION_TIMEOUT_MS = 60 * 60 * 1000 // 1 hour
const STORAGE_KEY = 'admin_last_activity'

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

export async function adminGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  // Allow access to login page
  if (!to.meta.requiresAdmin) {
    next()
    return
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      next('/bulk-station/login')
      return
    }

    // Check if session has timed out due to inactivity
    const lastActivity = getLastActivity()
    if (lastActivity > 0 && Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
      clearActivity()
      await supabase.auth.signOut()
      next('/bulk-station/login')
      return
    }

    // Verify admin role
    const userRole = session.user.user_metadata?.role
    if (userRole !== 'admin') {
      await supabase.auth.signOut()
      next('/bulk-station/login')
      return
    }

    // Update activity and allow access
    updateActivity()
    next()
  } catch {
    next('/bulk-station/login')
  }
}
