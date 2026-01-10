import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function check() {
  const { data, error } = await supabase
    .from('locations')
    .select('name, city')
    .order('name')

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log('=== Checking Location Names ===\n')

  // Check for any names that still have location suffixes or separators
  const suspicious = data.filter(loc =>
    loc.name.includes('|') ||
    loc.name.endsWith(' -') ||
    /\s+(Frankfurt|Bockenheim|Bornheim|Sachsenhausen|Nordend|Westend|Ostend|Offenbach|Darmstadt|Wiesbaden|Mainz|Hanau|Ginsheim|Maintal|Dörnigheim|Gustavsburg)$/i.test(loc.name) ||
    /\s+Bad\s+\w+$/i.test(loc.name)
  )

  if (suspicious.length > 0) {
    console.log('⚠️  Names that may still need cleanup:\n')
    suspicious.forEach(loc => {
      console.log(`  "${loc.name}" (city: ${loc.city})`)
    })
    console.log(`\n  Total suspicious: ${suspicious.length}`)
  } else {
    console.log('✅ All names look clean!')
  }

  console.log(`\n=== Total locations: ${data.length} ===`)
}

check()
