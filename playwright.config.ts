import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Load .env.test for admin e2e tests (ESM-compatible)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.test first (takes precedence)
dotenv.config({ path: resolve(__dirname, '.env.test') })
// Then load .env.development for fallback values (like VITE_SUPABASE_ANON_KEY)
dotenv.config({ path: resolve(__dirname, '.env.development') })

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Always use 1 worker - tests share database state and auth sessions
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    // Admin test setup - runs first to seed data
    {
      name: 'admin-setup',
      testMatch: /admin\.setup\.ts/,
    },

    // Admin tests - depend on setup
    {
      name: 'admin',
      testDir: './tests/e2e/admin',
      testIgnore: ['**/admin.setup.ts', '**/admin.teardown.ts'],
      dependencies: ['admin-setup'],
      use: {
        ...devices['Desktop Chrome'],
        // Reuse authenticated state from setup
        storageState: './tests/.auth/admin.json',
      },
    },

    // Admin teardown - runs after admin tests
    {
      name: 'admin-teardown',
      testMatch: /admin\.teardown\.ts/,
      dependencies: ['admin'],
    },

    // Global setup for non-admin tests - dismisses cookie banner
    {
      name: 'global-setup',
      testMatch: /global\.setup\.ts/,
    },

    // Regular e2e tests (existing) - exclude admin folder
    {
      name: 'chromium',
      testDir: './tests/e2e',
      testIgnore: ['**/admin/**', '**/global.setup.ts'],
      dependencies: ['global-setup'],
      use: {
        ...devices['Desktop Chrome'],
        // Reuse storage state from global setup (cookie consent dismissed)
        storageState: './tests/.auth/user.json',
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
