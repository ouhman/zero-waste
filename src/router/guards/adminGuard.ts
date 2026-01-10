import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { supabase } from '@/lib/supabase'

const SESSION_TIMEOUT_MS = 60 * 60 * 1000 // 1 hour
let lastActivityTime = Date.now()

// Update activity timestamp on any navigation
export function updateActivity() {
  lastActivityTime = Date.now()
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
    if (Date.now() - lastActivityTime > SESSION_TIMEOUT_MS) {
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
