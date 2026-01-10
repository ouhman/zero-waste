import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { updateActivity } from '@/router/guards/adminGuard'
import type { User, Session } from '@supabase/supabase-js'

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart']
const SESSION_CHECK_INTERVAL = 60 * 1000 // Check every minute

export function useAuth() {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)
  const router = useRouter()

  let checkInterval: ReturnType<typeof setInterval> | null = null

  function handleActivity() {
    updateActivity()
  }

  async function checkSession() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      await logout()
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
    session.value = null
    await router.push('/bulk-station/login')
  }

  onMounted(async () => {
    // Get initial session
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    user.value = data.session?.user ?? null
    loading.value = false

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
    })

    // Track user activity
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Periodic session check
    checkInterval = setInterval(checkSession, SESSION_CHECK_INTERVAL)
  })

  onUnmounted(() => {
    ACTIVITY_EVENTS.forEach(event => {
      document.removeEventListener(event, handleActivity)
    })
    if (checkInterval) clearInterval(checkInterval)
  })

  return {
    user,
    session,
    loading,
    logout
  }
}
