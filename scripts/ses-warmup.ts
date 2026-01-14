/**
 * SES Warm-Up Script (Direct Email)
 *
 * Sends verification-style emails directly via SES using real location data.
 * Does NOT create any database records - purely for warming up SES.
 *
 * Usage:
 *   npx tsx scripts/ses-warmup.ts [count]
 *
 * Run daily for 2-3 weeks to build a positive sending reputation.
 */

import 'dotenv/config'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { createClient } from '@supabase/supabase-js'

// Verified email addresses in SES sandbox
const VERIFIED_EMAILS = [
  'ouhman@gmail.com',
  'ouhman@protonmail.com',
  'brice.dufour69@hotmail.com',
  'lf@onapply.de',
]

// Config
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!
const AWS_REGION = 'eu-central-1'
const FROM_EMAIL = 'noreply@zerowastefrankfurt.de'

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const ses = new SESClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

interface Location {
  id: string
  name: string
  address: string
}

async function fetchRandomLocations(count: number): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, address')
    .eq('status', 'approved')
    .limit(100)

  if (error || !data) {
    console.error('Failed to fetch locations:', error)
    return []
  }

  // Shuffle and pick random ones
  const shuffled = data.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function generateEmailHtml(locationName: string): string {
  const fakeToken = crypto.randomUUID()
  const verificationUrl = `https://map.zerowastefrankfurt.de/verify?token=${fakeToken}`

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 40px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Bestätigen Sie Ihre Einreichung</h2>
    <p>Vielen Dank für Ihre Einreichung von <strong>${locationName}</strong> bei Zero Waste Frankfurt!</p>
    <p>Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf den folgenden Link klicken:</p>
    <a href="${verificationUrl}" class="button">Einreichung bestätigen</a>
    <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
    <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    <p>Dieser Link ist 24 Stunden gültig.</p>
    <p>Nach der Bestätigung wird Ihre Einreichung von unserem Team geprüft.</p>
    <div class="footer">
      <p>Zero Waste Frankfurt<br>
      <a href="https://zerowastefrankfurt.de">zerowastefrankfurt.de</a></p>
    </div>
  </div>
</body>
</html>
  `
}

function generateEmailText(locationName: string): string {
  const fakeToken = crypto.randomUUID()
  const verificationUrl = `https://map.zerowastefrankfurt.de/verify?token=${fakeToken}`

  return `
Bestätigen Sie Ihre Einreichung

Vielen Dank für Ihre Einreichung von "${locationName}" bei Zero Waste Frankfurt!

Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie den folgenden Link öffnen:
${verificationUrl}

Dieser Link ist 24 Stunden gültig.

Nach der Bestätigung wird Ihre Einreichung von unserem Team geprüft.

--
Zero Waste Frankfurt
https://zerowastefrankfurt.de
  `
}

async function sendWarmupEmail(toEmail: string, location: Location): Promise<boolean> {
  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: `Bestätigen Sie Ihre Einreichung: ${location.name}`,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: generateEmailHtml(location.name),
          Charset: 'UTF-8',
        },
        Text: {
          Data: generateEmailText(location.name),
          Charset: 'UTF-8',
        },
      },
    },
  })

  try {
    await ses.send(command)
    return true
  } catch (error) {
    console.error(`Failed to send to ${toEmail}:`, error)
    return false
  }
}

async function runWarmup(emailCount: number = 4) {
  console.log('='.repeat(60))
  console.log('SES Warm-Up Script (Direct Email)')
  console.log(`Date: ${new Date().toISOString()}`)
  console.log(`Target: ${emailCount} emails`)
  console.log('='.repeat(60))
  console.log()

  // Check AWS credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('Missing AWS credentials in .env')
    console.error('Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY')
    process.exit(1)
  }

  // Fetch random real locations
  console.log('Fetching random locations from database...')
  const locations = await fetchRandomLocations(emailCount)

  if (locations.length === 0) {
    console.error('No locations found!')
    process.exit(1)
  }

  console.log(`Found ${locations.length} locations\n`)

  let successful = 0
  let failed = 0

  for (let i = 0; i < emailCount; i++) {
    const email = VERIFIED_EMAILS[i % VERIFIED_EMAILS.length]
    const location = locations[i % locations.length]

    console.log(`[${i + 1}/${emailCount}] Sending to ${email}`)
    console.log(`    Location: ${location.name}`)

    const success = await sendWarmupEmail(email, location)

    if (success) {
      console.log(`    ✓ Sent!`)
      successful++
    } else {
      console.log(`    ✗ Failed`)
      failed++
    }

    // Wait 2-5 seconds between sends
    if (i < emailCount - 1) {
      const delay = 2000 + Math.random() * 3000
      console.log(`    Waiting ${Math.round(delay / 1000)}s...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    console.log()
  }

  // Summary
  console.log('='.repeat(60))
  console.log('Summary')
  console.log('='.repeat(60))
  console.log(`✓ Successful: ${successful}`)
  console.log(`✗ Failed: ${failed}`)
  console.log()
  console.log('No database records created - pure SES warm-up!')
  console.log('Run again tomorrow to continue building reputation.')
}

// Parse args and run
const emailCount = parseInt(process.argv[2]) || 4
runWarmup(emailCount)
