import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import {
  getAdminNotificationTemplate,
  getApprovalEmailTemplate,
  getRejectionEmailTemplate,
} from './email-templates.ts'

Deno.test('getAdminNotificationTemplate - should generate email with correct data', () => {
  const locationName = 'Test Cafe'
  const submitterEmail = 'test@example.com'
  const submittedAt = '2026-01-10T12:00:00.000Z'
  const adminPanelUrl = 'https://map.zerowastefrankfurt.de/bulk-station/pending'

  const template = getAdminNotificationTemplate(
    locationName,
    submitterEmail,
    submittedAt,
    adminPanelUrl
  )

  // Check subject
  assertEquals(template.subject, 'Neue Einreichung: Test Cafe')

  // Check HTML contains all required info
  assertStringIncludes(template.html, locationName)
  assertStringIncludes(template.html, submitterEmail)
  assertStringIncludes(template.html, adminPanelUrl)
  assertStringIncludes(template.html, 'Neue Standort-Einreichung')

  // Check text version contains all required info
  assertStringIncludes(template.text, locationName)
  assertStringIncludes(template.text, submitterEmail)
  assertStringIncludes(template.text, adminPanelUrl)
  assertStringIncludes(template.text, 'Neue Standort-Einreichung')

  // Check that date formatting doesn't crash (German locale)
  assertStringIncludes(template.html, '2026')
  assertStringIncludes(template.text, '2026')
})

Deno.test('getApprovalEmailTemplate - German version', () => {
  const locationName = 'Bio Markt'
  const template = getApprovalEmailTemplate(locationName, 'de')

  // Check subject
  assertEquals(template.subject, 'Genehmigt: Bio Markt')

  // Check HTML
  assertStringIncludes(template.html, locationName)
  assertStringIncludes(template.html, 'Ihre Einreichung wurde genehmigt')
  assertStringIncludes(template.html, 'https://map.zerowastefrankfurt.de')

  // Check text version
  assertStringIncludes(template.text, locationName)
  assertStringIncludes(template.text, 'Ihre Einreichung wurde genehmigt')
  assertStringIncludes(template.text, 'https://map.zerowastefrankfurt.de')
})

Deno.test('getApprovalEmailTemplate - English version', () => {
  const locationName = 'Organic Market'
  const template = getApprovalEmailTemplate(locationName, 'en')

  // Check subject
  assertEquals(template.subject, 'Approved: Organic Market')

  // Check HTML
  assertStringIncludes(template.html, locationName)
  assertStringIncludes(template.html, 'Your Submission Was Approved')
  assertStringIncludes(template.html, 'https://map.zerowastefrankfurt.de')

  // Check text version
  assertStringIncludes(template.text, locationName)
  assertStringIncludes(template.text, 'Your Submission Was Approved')
  assertStringIncludes(template.text, 'https://map.zerowastefrankfurt.de')
})

Deno.test('getApprovalEmailTemplate - defaults to German', () => {
  const locationName = 'Test Location'
  const template = getApprovalEmailTemplate(locationName)

  // Should contain German text
  assertStringIncludes(template.html, 'Ihre Einreichung wurde genehmigt')
})

Deno.test('getRejectionEmailTemplate - German version', () => {
  const locationName = 'Test Shop'
  const reason = 'Adresse konnte nicht verifiziert werden'
  const template = getRejectionEmailTemplate(locationName, reason, 'de')

  // Check subject
  assertEquals(template.subject, 'Update zu Ihrer Einreichung: Test Shop')

  // Check HTML
  assertStringIncludes(template.html, locationName)
  assertStringIncludes(template.html, reason)
  assertStringIncludes(template.html, 'Update zu Ihrer Einreichung')
  assertStringIncludes(template.html, 'https://map.zerowastefrankfurt.de')

  // Check text version
  assertStringIncludes(template.text, locationName)
  assertStringIncludes(template.text, reason)
  assertStringIncludes(template.text, 'Update zu Ihrer Einreichung')
})

Deno.test('getRejectionEmailTemplate - English version', () => {
  const locationName = 'Test Shop'
  const reason = 'Address could not be verified'
  const template = getRejectionEmailTemplate(locationName, reason, 'en')

  // Check subject
  assertEquals(template.subject, 'Update on Your Submission: Test Shop')

  // Check HTML
  assertStringIncludes(template.html, locationName)
  assertStringIncludes(template.html, reason)
  assertStringIncludes(template.html, 'Update on Your Submission')
  assertStringIncludes(template.html, 'https://map.zerowastefrankfurt.de')

  // Check text version
  assertStringIncludes(template.text, locationName)
  assertStringIncludes(template.text, reason)
  assertStringIncludes(template.text, 'Update on Your Submission')
})

Deno.test('getRejectionEmailTemplate - defaults to German', () => {
  const locationName = 'Test Location'
  const reason = 'Test reason'
  const template = getRejectionEmailTemplate(locationName, reason)

  // Should contain German text
  assertStringIncludes(template.html, 'Update zu Ihrer Einreichung')
})

Deno.test('All templates - should include proper HTML structure', () => {
  const adminTemplate = getAdminNotificationTemplate(
    'Test',
    'test@test.com',
    new Date().toISOString(),
    'https://test.com'
  )
  const approvalTemplate = getApprovalEmailTemplate('Test', 'de')
  const rejectionTemplate = getRejectionEmailTemplate('Test', 'Reason', 'de')

  // All should have HTML doctype
  assertStringIncludes(adminTemplate.html, '<!DOCTYPE html>')
  assertStringIncludes(approvalTemplate.html, '<!DOCTYPE html>')
  assertStringIncludes(rejectionTemplate.html, '<!DOCTYPE html>')

  // All should have charset
  assertStringIncludes(adminTemplate.html, 'charset="utf-8"')
  assertStringIncludes(approvalTemplate.html, 'charset="utf-8"')
  assertStringIncludes(rejectionTemplate.html, 'charset="utf-8"')

  // All should have footer
  assertStringIncludes(adminTemplate.html, 'Zero Waste Frankfurt')
  assertStringIncludes(approvalTemplate.html, 'Zero Waste Frankfurt')
  assertStringIncludes(rejectionTemplate.html, 'Zero Waste Frankfurt')
})

Deno.test('All templates - should have both HTML and text versions', () => {
  const adminTemplate = getAdminNotificationTemplate(
    'Test',
    'test@test.com',
    new Date().toISOString(),
    'https://test.com'
  )
  const approvalTemplate = getApprovalEmailTemplate('Test', 'de')
  const rejectionTemplate = getRejectionEmailTemplate('Test', 'Reason', 'de')

  // All should have subject, html, and text
  assertEquals(typeof adminTemplate.subject, 'string')
  assertEquals(typeof adminTemplate.html, 'string')
  assertEquals(typeof adminTemplate.text, 'string')

  assertEquals(typeof approvalTemplate.subject, 'string')
  assertEquals(typeof approvalTemplate.html, 'string')
  assertEquals(typeof approvalTemplate.text, 'string')

  assertEquals(typeof rejectionTemplate.subject, 'string')
  assertEquals(typeof rejectionTemplate.html, 'string')
  assertEquals(typeof rejectionTemplate.text, 'string')

  // All text versions should be non-empty
  assertEquals(adminTemplate.text.trim().length > 0, true)
  assertEquals(approvalTemplate.text.trim().length > 0, true)
  assertEquals(rejectionTemplate.text.trim().length > 0, true)
})
