#!/usr/bin/env tsx
/**
 * Import data to PROD Supabase project
 * Reads CSV exports and inserts via Supabase client
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// PROD credentials - replace with actual values
const PROD_URL = process.env.PROD_SUPABASE_URL || ''
const PROD_SERVICE_KEY = process.env.PROD_SUPABASE_SERVICE_KEY || ''

if (!PROD_URL || !PROD_SERVICE_KEY) {
  console.error('Error: PROD_SUPABASE_URL and PROD_SUPABASE_SERVICE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(PROD_URL, PROD_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface CategoryRow {
  id: string
  name_de: string
  name_en: string
  slug: string
  icon: string
  color: string
  sort_order: number
  created_at: string
  icon_url: string | null
  description_de: string | null
  description_en: string | null
  updated_at: string
  always_open: boolean
}

interface LocationRow {
  id: string
  name: string
  slug: string
  description_de: string | null
  description_en: string | null
  address: string
  city: string
  postal_code: string | null
  latitude: number
  longitude: number
  website: string | null
  phone: string | null
  email: string | null
  instagram: string | null
  opening_hours_text: string | null
  submission_type: string
  submitted_by_email: string | null
  related_location_id: string | null
  status: string
  approved_by: string | null
  rejection_reason: string | null
  admin_notes: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  payment_methods: any
  opening_hours_osm: string | null
  opening_hours_structured: any
  facilities: any
  suburb: string | null
}

interface LocationCategoryRow {
  location_id: string
  category_id: string
}

async function parseCopySql(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')

  const sections: Record<string, any[]> = {
    categories: [],
    locations: [],
    location_categories: []
  }

  let currentTable: string | null = null
  let columns: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check for COPY statement
    const copyMatch = line.match(/COPY "public"\."(\w+)" \(([^)]+)\) FROM stdin/)
    if (copyMatch) {
      currentTable = copyMatch[1]
      columns = copyMatch[2].split(', ').map(c => c.replace(/"/g, ''))
      continue
    }

    // End of data section
    if (line.trim() === '\\.') {
      currentTable = null
      columns = []
      continue
    }

    // Parse data line
    if (currentTable && line.trim() && !line.startsWith('--')) {
      const values = line.split('\t')
      const row: Record<string, any> = {}

      columns.forEach((col, idx) => {
        let value = values[idx]?.trim()

        // Handle NULL
        if (value === '\\N' || value === undefined) {
          row[col] = null
        }
        // Handle booleans
        else if (value === 't') {
          row[col] = true
        } else if (value === 'f') {
          row[col] = false
        }
        // Handle JSON
        else if ((value.startsWith('{') && value.endsWith('}')) ||
                 (value.startsWith('[') && value.endsWith(']'))) {
          try {
            row[col] = JSON.parse(value)
          } catch {
            row[col] = value
          }
        }
        // Handle numbers (latitude, longitude, sort_order)
        else if (col === 'latitude' || col === 'longitude' || col === 'sort_order') {
          row[col] = parseFloat(value)
        }
        // String values
        else {
          row[col] = value
        }
      })

      sections[currentTable]?.push(row)
    }
  }

  return sections
}

async function importData() {
  console.log('=== Importing Data to PROD ===\n')

  const dataFile = 'migration-export/prod-data.sql'

  console.log(`Parsing ${dataFile}...`)
  const data = await parseCopySql(dataFile)

  console.log(`\nData summary:`)
  console.log(`  Categories: ${data.categories.length}`)
  console.log(`  Locations: ${data.locations.length}`)
  console.log(`  Location-categories: ${data.location_categories.length}`)

  // Import categories
  console.log(`\n1. Importing categories...`)
  const { error: catError } = await supabase
    .from('categories')
    .insert(data.categories)

  if (catError) {
    console.error('Error inserting categories:', catError)
    return
  }
  console.log(`  ✓ Inserted ${data.categories.length} categories`)

  // Import locations in batches (Supabase has a limit)
  console.log(`\n2. Importing locations...`)
  const batchSize = 100
  for (let i = 0; i < data.locations.length; i += batchSize) {
    const batch = data.locations.slice(i, i + batchSize)
    const { error: locError } = await supabase
      .from('locations')
      .insert(batch)

    if (locError) {
      console.error(`Error inserting locations batch ${i / batchSize + 1}:`, locError)
      return
    }
    console.log(`  ✓ Inserted batch ${i / batchSize + 1} (${batch.length} locations)`)
  }

  // Import location_categories
  console.log(`\n3. Importing location_categories...`)
  const { error: lcError } = await supabase
    .from('location_categories')
    .insert(data.location_categories)

  if (lcError) {
    console.error('Error inserting location_categories:', lcError)
    return
  }
  console.log(`  ✓ Inserted ${data.location_categories.length} location-category relationships`)

  console.log('\n=== Import Complete! ===')
}

importData().catch(console.error)
