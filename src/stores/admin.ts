import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import type { HoursSuggestionWithLocation, StructuredOpeningHours } from '@/types'

type Location = Database['public']['Tables']['locations']['Row']
type LocationUpdate = Database['public']['Tables']['locations']['Update']
type LocationCategoryInsert = Database['public']['Tables']['location_categories']['Insert']

type LocationWithCategories = Location & {
  location_categories?: { category_id: string }[]
}

export const useAdminStore = defineStore('admin', () => {
  const locations = ref<LocationWithCategories[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasFetched = ref(false)
  const lastFetchedStatus = ref<string | undefined>(undefined)

  // Hours suggestions state
  const hoursSuggestions = ref<HoursSuggestionWithLocation[]>([])
  const pendingSuggestionsCount = ref(0)

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

  async function fetchLocations(status?: string, force = false, categoryId?: string) {
    // Cache: Don't fetch if already loaded with same status (unless forced)
    if (!force && hasFetched.value && lastFetchedStatus.value === status && !categoryId) {
      return
    }

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

      // Filter by category if provided (client-side since we need the join)
      let filteredData = (data || []) as LocationWithCategories[]
      if (categoryId) {
        filteredData = filteredData.filter(location =>
          location.location_categories?.some((lc: { category_id: string }) => lc.category_id === categoryId)
        )
      }

      locations.value = filteredData
      hasFetched.value = true
      lastFetchedStatus.value = status
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
      const updateData: LocationUpdate = { ...updates, updated_at: new Date().toISOString() }
      const { error: updateError } = await supabase
        .from('locations')
        .update(updateData as never)
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
          const insertData: LocationCategoryInsert[] = categoryIds.map(cid => ({
            location_id: id,
            category_id: cid
          }))
          await supabase
            .from('location_categories')
            .insert(insertData as never)
        }
      }

      // Refresh local state - force refetch to ensure fresh data
      await fetchLocations(lastFetchedStatus.value, true)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function approveLocation(id: string) {
    // Store original location for rollback on optimistic update
    const originalLocation = locations.value.find(l => l.id === id)
    if (!originalLocation) return

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id || null

    // Optimistic update: Update local state immediately
    const index = locations.value.findIndex(l => l.id === id)
    if (index !== -1) {
      locations.value[index] = {
        ...locations.value[index],
        status: 'approved',
        approved_by: userId,
        updated_at: new Date().toISOString()
      }
    }

    try {
      // Call updateLocation to perform the server update
      await updateLocation(id, {
        status: 'approved',
        approved_by: userId
      })
    } catch (e) {
      // Rollback optimistic update on error
      if (index !== -1 && originalLocation) {
        locations.value[index] = originalLocation
      }
      throw e
    }
  }

  async function rejectLocation(id: string, reason: string) {
    // Store original location for rollback on optimistic update
    const originalLocation = locations.value.find(l => l.id === id)
    if (!originalLocation) return

    // Optimistic update: Update local state immediately
    const index = locations.value.findIndex(l => l.id === id)
    if (index !== -1) {
      locations.value[index] = {
        ...locations.value[index],
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      }
    }

    try {
      // Call updateLocation to perform the server update
      await updateLocation(id, {
        status: 'rejected',
        rejection_reason: reason
      })
    } catch (e) {
      // Rollback optimistic update on error
      if (index !== -1 && originalLocation) {
        locations.value[index] = originalLocation
      }
      throw e
    }
  }

  async function fetchHoursSuggestions(status?: 'pending' | 'approved' | 'rejected') {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('hours_suggestions')
        .select(`
          *,
          location:locations(id, name, slug, opening_hours_structured)
        `)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      hoursSuggestions.value = data as HoursSuggestionWithLocation[]
      return { data, error: null }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to fetch hours suggestions'
      error.value = errorMessage
      return { data: null, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  async function fetchPendingSuggestionsCount() {
    const { count } = await supabase
      .from('hours_suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    pendingSuggestionsCount.value = count || 0
  }

  async function reviewSuggestion(
    id: string,
    status: 'approved' | 'rejected',
    adminNote?: string
  ) {
    const { data: userData } = await supabase.auth.getUser()

    const { error: updateError } = await supabase
      .from('hours_suggestions')
      .update({
        status,
        admin_note: adminNote || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userData.user?.id
      })
      .eq('id', id)

    if (updateError) {
      return { error: updateError }
    }

    if (status === 'approved') {
      // Also update the location's opening hours
      const suggestion = hoursSuggestions.value.find(s => s.id === id)
      if (suggestion) {
        await updateLocationHours(suggestion.location_id, suggestion.suggested_hours)
      }
    }

    // Refresh the list
    await fetchHoursSuggestions()
    await fetchPendingSuggestionsCount()

    return { error: null }
  }

  async function updateLocationHours(locationId: string, hours: StructuredOpeningHours) {
    // Update structured hours
    return supabase
      .from('locations')
      .update({
        opening_hours_structured: hours as never
      })
      .eq('id', locationId)
  }

  async function deleteLocation(id: string) {
    // Soft delete by setting deleted_at
    const { error: deleteError } = await supabase
      .from('locations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    // Remove from local state
    locations.value = locations.value.filter(l => l.id !== id)
  }

  return {
    locations,
    loading,
    error,
    pendingLocations,
    approvedLocations,
    rejectedLocations,
    stats,
    hoursSuggestions,
    pendingSuggestionsCount,
    fetchLocations,
    updateLocation,
    approveLocation,
    rejectLocation,
    fetchHoursSuggestions,
    fetchPendingSuggestionsCount,
    reviewSuggestion,
    updateLocationHours,
    deleteLocation
  }
})
