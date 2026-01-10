import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row']

export function useAdmin() {
  const pendingLocations = ref<Location[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPendingLocations() {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('locations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (fetchError) {
        error.value = fetchError.message
        return
      }

      pendingLocations.value = data || []
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  async function approveLocation(locationId: string) {
    loading.value = true
    error.value = null

    try {
      const { data: userData } = await supabase.auth.getUser()

      const { error: updateError } = await supabase
        .from('locations')
        .update({
          status: 'approved',
          approved_by: userData?.user?.id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', locationId)

      if (updateError) {
        error.value = updateError.message
        return
      }

      // Remove from pending list
      pendingLocations.value = pendingLocations.value.filter(
        (loc) => loc.id !== locationId
      )
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  async function rejectLocation(locationId: string, reason: string) {
    loading.value = true
    error.value = null

    try {
      const { error: updateError } = await supabase
        .from('locations')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', locationId)

      if (updateError) {
        error.value = updateError.message
        return
      }

      // Remove from pending list
      pendingLocations.value = pendingLocations.value.filter(
        (loc) => loc.id !== locationId
      )
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  async function updateLocation(locationId: string, updates: Partial<Location>) {
    loading.value = true
    error.value = null

    try {
      const { error: updateError } = await supabase
        .from('locations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', locationId)

      if (updateError) {
        error.value = updateError.message
        return
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  return {
    pendingLocations,
    loading,
    error,
    fetchPendingLocations,
    approveLocation,
    rejectLocation,
    updateLocation
  }
}
