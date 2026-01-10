import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasFetched = ref(false)

  async function fetchCategories() {
    // Cache: Don't fetch if already loaded
    if (hasFetched.value) {
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

  return {
    categories,
    loading,
    error,
    fetchCategories,
    getCategoryBySlug
  }
})
