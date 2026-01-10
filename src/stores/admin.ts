import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row']
type LocationWithCategories = Location & {
  location_categories?: { category_id: string }[]
}

export const useAdminStore = defineStore('admin', () => {
  const locations = ref<LocationWithCategories[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pendingLocations = computed(() =>
    locations.value.filter(l => l.status === 'pending')
  )

  const approvedLocations = computed(() =>
    locations.value.filter(l => l.status === 'approved')
  )

  const rejectedLocations = computed(() =>
    locations.value.filter(l => l.status === 'rejected')
  )

  const stats = computed(() => ({
    pending: pendingLocations.value.length,
    approved: approvedLocations.value.length,
    rejected: rejectedLocations.value.length,
    total: locations.value.length
  }))

  async function fetchLocations(status?: string) {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('locations')
        .select(`
          *,
          location_categories(category_id)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      locations.value = data || []
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch locations'
    } finally {
      loading.value = false
    }
  }

  async function updateLocation(
    id: string,
    updates: Partial<Location>,
    categoryIds?: string[]
  ) {
    loading.value = true
    error.value = null

    try {
      // Update location
      const { error: updateError } = await (supabase
        .from('locations') as any)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) throw updateError

      // Update categories if provided
      if (categoryIds !== undefined) {
        // Delete existing
        await supabase
          .from('location_categories')
          .delete()
          .eq('location_id', id)

        // Insert new
        if (categoryIds.length > 0) {
          await (supabase
            .from('location_categories') as any)
            .insert(categoryIds.map(cid => ({
              location_id: id,
              category_id: cid
            })))
        }
      }

      // Refresh local state
      await fetchLocations()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function approveLocation(id: string) {
    const { data: userData } = await supabase.auth.getUser()
    await updateLocation(id, {
      status: 'approved',
      approved_by: userData?.user?.id || null
    })
  }

  async function rejectLocation(id: string, reason: string) {
    await updateLocation(id, {
      status: 'rejected',
      rejection_reason: reason
    })
  }

  return {
    locations,
    loading,
    error,
    pendingLocations,
    approvedLocations,
    rejectedLocations,
    stats,
    fetchLocations,
    updateLocation,
    approveLocation,
    rejectLocation
  }
})
