// Global teardown for admin e2e tests
// Cleans up all test data

import { test as teardown } from '@playwright/test'
import { cleanupTestData } from './fixtures'

teardown('cleanup admin test data', async () => {
  console.log('\n🧹 Cleaning up admin test data...')

  try {
    await cleanupTestData()
    console.log('✓ Admin test data cleaned up successfully\n')
  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error)
    // Don't throw - we don't want to fail the test run if cleanup fails
  }
})
