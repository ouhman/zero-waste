import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { supabase } from '@/lib/supabase'

export async function adminGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  // Allow access to login page without authentication
  if (!to.meta.requiresAdmin) {
    next()
    return
  }

  try {
    const { data, error } = await supabase.auth.getUser()

    if (error || !data.user) {
      // Redirect to login if not authenticated
      next('/admin/login')
      return
    }

    // User is authenticated, allow access
    next()
  } catch (error) {
    // On error, redirect to login
    next('/admin/login')
  }
}
