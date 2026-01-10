import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row'] & {
  location_categories?: {
    categories: Database['public']['Tables']['categories']['Row']
  }[]
}

export function useFilters() {
  /**
   * Filter locations by category slugs (OR logic)
   * @param locations - Array of locations to filter
   * @param categorySlugs - Array of category slugs to filter by
   * @returns Filtered locations
   */
  function filterByCategories(locations: Location[], categorySlugs: string[]): Location[] {
    // No filters = return all
    if (categorySlugs.length === 0) {
      return locations
    }

    return locations.filter(location => {
      // No categories = exclude
      if (!location.location_categories || location.location_categories.length === 0) {
        return false
      }

      // Check if location has ANY of the selected categories (OR logic)
      return location.location_categories.some(lc =>
        categorySlugs.includes(lc.categories.slug)
      )
    })
  }

  return {
    filterByCategories
  }
}
