#!/usr/bin/env npx ts-node
/**
 * Phase 1: Verify Bücherschrank category
 *
 * This script:
 * 1. Checks if a category with slug 'buecherschrank' exists
 * 2. If not, provides instructions for creating it
 * 3. Returns the category ID for use in Phase 4
 *
 * Note: Categories require admin privileges to create.
 * Use create-buecherschrank-category.sql in Supabase SQL Editor if needed.
 *
 * Usage:
 *   npx ts-node scripts/create-buecherschrank-category.ts
 *
 * Environment:
 *   Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const CATEGORY_SPEC = {
  slug: 'buecherschrank',
  name_de: 'Bücherschrank',
  name_en: 'Public Bookcase',
  icon: '📚',
  color: '#8B4513', // brown
  description_de: 'Offene Bücherschränke zum kostenlosen Tauschen und Ausleihen von Büchern',
  description_en: 'Public bookcases for free book exchange',
}

async function main() {
  console.log('🔍 Phase 1: Bücherschrank Category Setup\n')

  // Step 1: Check if category already exists
  console.log('Checking if category already exists...')
  const { data: existing, error: checkError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', CATEGORY_SPEC.slug)
    .maybeSingle()

  if (checkError) {
    console.error('❌ Error checking for existing category:', checkError)
    process.exit(1)
  }

  if (existing) {
    console.log('✅ Category already exists!')
    console.log('\nCategory Details:')
    console.log('  ID:', existing.id)
    console.log('  Slug:', existing.slug)
    console.log('  Name (DE):', existing.name_de)
    console.log('  Name (EN):', existing.name_en)
    console.log('  Icon:', existing.icon)
    console.log('  Color:', existing.color)
    console.log('  Description (DE):', existing.description_de)
    console.log('  Description (EN):', existing.description_en)
    console.log('  Created:', existing.created_at)
    console.log('\n' + '='.repeat(60))
    console.log('✅ Phase 1 Complete - Category Verified')
    console.log('='.repeat(60))
    console.log('\nCategory ID for Phase 4:', existing.id)
    console.log('\nNext Steps:')
    console.log('  1. Save this category ID: ' + existing.id)
    console.log('  2. Proceed to Phase 2 (data extraction)')
    return
  }

  // Step 2: Category doesn't exist - create it
  console.log('⚠️  Category does not exist. Creating it now...\n')

  // Get the next sort_order
  const { data: maxSort } = await supabase
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = (maxSort?.sort_order || 0) + 1

  // Insert the category
  const { data: newCategory, error: insertError } = await supabase
    .from('categories')
    .insert({
      ...CATEGORY_SPEC,
      sort_order: nextSortOrder,
    })
    .select()
    .single()

  if (insertError) {
    console.error('❌ Error creating category:', insertError)
    console.log('\nIf RLS is blocking, use the migration file:')
    console.log('  supabase/migrations/20260112000000_add_buecherschrank_category.sql')
    process.exit(1)
  }

  console.log('✅ Category created successfully!')
  console.log('\nCategory Details:')
  console.log('  ID:', newCategory.id)
  console.log('  Slug:', newCategory.slug)
  console.log('  Name (DE):', newCategory.name_de)
  console.log('  Name (EN):', newCategory.name_en)
  console.log('  Icon:', newCategory.icon)
  console.log('  Color:', newCategory.color)
  console.log('  Description (DE):', newCategory.description_de)
  console.log('  Description (EN):', newCategory.description_en)
  console.log('  Sort Order:', newCategory.sort_order)
  console.log('  Created:', newCategory.created_at)
  console.log('\n' + '='.repeat(60))
  console.log('✅ Phase 1 Complete - Category Created')
  console.log('='.repeat(60))
  console.log('\nCategory ID for Phase 4:', newCategory.id)
  console.log('\nNext Steps:')
  console.log('  1. Save this category ID: ' + newCategory.id)
  console.log('  2. Proceed to Phase 2 (data extraction)')
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
