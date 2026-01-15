/**
 * Curated Icons for Sustainable Locations
 * Organized by category for easy discovery
 * Part of Dynamic Markers implementation
 * See: ai/plans/2026-01-15-dynamic-markers.md
 */

export interface CuratedIcon {
  name: string
  label: string
}

export interface CuratedIconCategories {
  [category: string]: CuratedIcon[]
}

/**
 * Curated icons organized by category
 * Icons selected from Material Design Icons (mdi:*) for consistency
 */
export const CURATED_ICONS: CuratedIconCategories = {
  food: [
    { name: 'mdi:food-apple', label: 'Apple/Produce' },
    { name: 'mdi:bread-slice', label: 'Bakery' },
    { name: 'mdi:coffee', label: 'Café' },
    { name: 'mdi:silverware-fork-knife', label: 'Restaurant' },
    { name: 'mdi:fruit-cherries', label: 'Fruits' },
    { name: 'mdi:cheese', label: 'Cheese/Deli' },
    { name: 'mdi:leaf', label: 'Organic/Bio' },
    { name: 'mdi:barn', label: 'Farm Shop' },
    { name: 'mdi:cow', label: 'Dairy' },
    { name: 'mdi:carrot', label: 'Vegetables' },
    { name: 'mdi:food-variant', label: 'General Food' },
  ],
  shopping: [
    { name: 'mdi:shopping', label: 'Shopping' },
    { name: 'mdi:store', label: 'Store' },
    { name: 'mdi:hanger', label: 'Clothing' },
    { name: 'mdi:tshirt-crew', label: 'T-Shirt/Fashion' },
    { name: 'mdi:package-variant', label: 'Unpackaged' },
    { name: 'mdi:tag-multiple', label: 'Flea Market' },
    { name: 'mdi:basket', label: 'Market Basket' },
    { name: 'mdi:swap-horizontal', label: 'Exchange/Share' },
    { name: 'mdi:cart', label: 'Shopping Cart' },
  ],
  services: [
    { name: 'mdi:tools', label: 'Repair' },
    { name: 'mdi:wrench', label: 'Tool/Fix' },
    { name: 'mdi:hammer-screwdriver', label: 'Workshop' },
    { name: 'mdi:spray-bottle', label: 'Household/Cleaning' },
    { name: 'mdi:washing-machine', label: 'Laundry' },
    { name: 'mdi:scissors-cutting', label: 'Tailor' },
  ],
  environment: [
    { name: 'mdi:recycle', label: 'Recycling' },
    { name: 'mdi:recycle-variant', label: 'Recycle Alt' },
    { name: 'mdi:water', label: 'Water' },
    { name: 'mdi:water-pump', label: 'Water Station' },
    { name: 'mdi:tree', label: 'Tree/Nature' },
    { name: 'mdi:sprout', label: 'Sprout/Growth' },
    { name: 'mdi:compost', label: 'Compost' },
  ],
  culture: [
    { name: 'mdi:bookshelf', label: 'Bookshelf/Library' },
    { name: 'mdi:book-open-variant', label: 'Book' },
    { name: 'mdi:bed', label: 'Accommodation' },
    { name: 'mdi:home-heart', label: 'Home/Hospitality' },
    { name: 'mdi:gift', label: 'Gift/Present' },
  ],
  transport: [
    { name: 'mdi:bike', label: 'Bicycle' },
    { name: 'mdi:car-electric', label: 'Electric Car' },
    { name: 'mdi:bus', label: 'Bus' },
    { name: 'mdi:walk', label: 'Walking' },
  ],
  general: [
    { name: 'mdi:map-marker', label: 'Map Marker' },
    { name: 'mdi:map-marker-circle', label: 'Marker Circle' },
    { name: 'mdi:heart', label: 'Heart/Love' },
    { name: 'mdi:star', label: 'Star' },
    { name: 'mdi:information', label: 'Information' },
    { name: 'mdi:help-circle', label: 'Help' },
    { name: 'mdi:earth', label: 'Earth/Global' },
  ],
}

/**
 * Get all curated icons as a flat array
 */
export function getAllCuratedIcons(): CuratedIcon[] {
  return Object.values(CURATED_ICONS).flat()
}

/**
 * Get category names
 */
export function getCuratedCategories(): string[] {
  return Object.keys(CURATED_ICONS)
}

/**
 * Search curated icons by label or name
 */
export function searchCuratedIcons(query: string): CuratedIcon[] {
  if (!query.trim()) {
    return getAllCuratedIcons()
  }

  const lowerQuery = query.toLowerCase()
  const allIcons = getAllCuratedIcons()

  return allIcons.filter(icon =>
    icon.label.toLowerCase().includes(lowerQuery) ||
    icon.name.toLowerCase().includes(lowerQuery)
  )
}
