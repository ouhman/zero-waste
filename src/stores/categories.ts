import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']
type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasFetched = ref(false)

  async function fetchCategories(force = false) {
    // Cache: Don't fetch if already loaded (unless force is true)
    if (hasFetched.value && !force) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (fetchError) {
        error.value = fetchError.message
      } else {
        categories.value = data || []
        hasFetched.value = true
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error occurred'
    } finally {
      loading.value = false
    }
  }

  function getCategoryBySlug(slug: string): Category | undefined {
    return categories.value.find(category => category.slug === slug)
  }

  // Admin methods

  async function uploadIcon(slug: string, file: File): Promise<string> {
    // Validate file type
    if (!file.type.startsWith('image/png')) {
      throw new Error('Only PNG files are allowed for category icons')
    }

    // Generate unique filename
    const timestamp = Date.now()
    const path = `${slug}-${timestamp}.png`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('category-icons')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data } = supabase.storage
      .from('category-icons')
      .getPublicUrl(path)

    return data.publicUrl
  }

  async function deleteIcon(iconUrl: string): Promise<void> {
    // Extract path from URL
    const url = new URL(iconUrl)
    const pathMatch = url.pathname.match(/category-icons\/(.+)$/)

    if (!pathMatch) {
      return // Invalid URL format, skip deletion
    }

    const path = pathMatch[1]

    // Delete from storage
    await supabase.storage
      .from('category-icons')
      .remove([path])
  }

  async function createCategory(category: CategoryInsert, iconFile?: File): Promise<Category> {
    loading.value = true
    error.value = null

    try {
      // Upload icon if provided
      let iconUrl: string | null = null
      if (iconFile) {
        iconUrl = await uploadIcon(category.slug, iconFile)
      }

      // Insert category
      const { data, error: insertError } = await (supabase
        .from('categories') as any)
        .insert({
          ...category,
          icon_url: iconUrl,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) throw insertError
      if (!data) throw new Error('Failed to create category')

      // Refresh categories
      await fetchCategories(true)

      return data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create category'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateCategory(
    id: string,
    updates: CategoryUpdate,
    iconFile?: File
  ): Promise<Category> {
    loading.value = true
    error.value = null

    try {
      // Get current category to check for old icon
      const currentCategory = categories.value.find(c => c.id === id)

      // Handle icon update
      if (iconFile) {
        // Delete old icon if it exists
        if (currentCategory?.icon_url) {
          await deleteIcon(currentCategory.icon_url).catch(() => {
            // Ignore errors when deleting old icon
          })
        }

        // Upload new icon
        updates.icon_url = await uploadIcon(updates.slug || currentCategory?.slug || '', iconFile)
      }

      // Update category
      const { data, error: updateError } = await (supabase
        .from('categories') as any)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      if (!data) throw new Error('Failed to update category')

      // Refresh categories
      await fetchCategories(true)

      return data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update category'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteCategory(id: string, reassignTo: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Get category to check for icon
      const category = categories.value.find(c => c.id === id)

      // Prevent deletion of "Other" category (andere)
      if (category?.slug === 'andere') {
        throw new Error('Cannot delete the "Other" category')
      }

      // Reassign all locations to the new category
      const { error: reassignError } = await (supabase
        .from('location_categories') as any)
        .update({ category_id: reassignTo })
        .eq('category_id', id)

      if (reassignError) throw reassignError

      // Delete icon from storage if it exists
      if (category?.icon_url) {
        await deleteIcon(category.icon_url).catch(() => {
          // Ignore errors when deleting icon
        })
      }

      // Delete category
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Refresh categories
      await fetchCategories(true)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete category'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function getLocationCountForCategory(categoryId: string): Promise<number> {
    const { count, error: countError } = await supabase
      .from('location_categories')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)

    if (countError) {
      return 0
    }

    return count || 0
  }

  return {
    categories,
    loading,
    error,
    fetchCategories,
    getCategoryBySlug,
    // Admin methods
    uploadIcon,
    createCategory,
    updateCategory,
    deleteCategory,
    getLocationCountForCategory
  }
})
