#!/usr/bin/env npx ts-node
/**
 * Update Bücherschrank category color to purple
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🎨 Updating Bücherschrank category color to purple...\n')

  const { data, error } = await supabase
    .from('categories')
    .update({ color: '#8B5CF6' })
    .eq('slug', 'buecherschrank')
    .select()
    .single()

  if (error) {
    console.error('❌ Error updating category:', error)
    process.exit(1)
  }

  console.log('✅ Category color updated successfully!')
  console.log('   Slug:', data.slug)
  console.log('   New Color:', data.color)
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
