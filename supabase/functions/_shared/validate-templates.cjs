/**
 * Simple validation script for email templates
 * Since Deno isn't available, this Node.js script validates the templates manually
 */

// Mock the template functions by reading and evaluating them
const fs = require('fs');
const path = require('path');

console.log('Validating email templates...\n');

// Read the templates file
const templatesPath = path.join(__dirname, 'email-templates.ts');
const templatesCode = fs.readFileSync(templatesPath, 'utf-8');

// Check for required exports
const requiredExports = [
  'getAdminNotificationTemplate',
  'getApprovalEmailTemplate',
  'getRejectionEmailTemplate',
];

let allValid = true;

requiredExports.forEach(exportName => {
  if (templatesCode.includes(`export function ${exportName}`)) {
    console.log(`✓ ${exportName} is exported`);
  } else {
    console.log(`✗ ${exportName} is NOT exported`);
    allValid = false;
  }
});

// Check for required template elements
const requiredElements = {
  'HTML DOCTYPE': '<!DOCTYPE html>',
  'UTF-8 charset': 'charset="utf-8"',
  'Email template interface': 'interface EmailTemplate',
  'Subject field': 'subject:',
  'HTML field': 'html:',
  'Text field': 'text:',
  'German locale formatting': 'de-DE',
  'Base styles': 'baseStyles',
};

console.log('\nChecking template structure...');
Object.entries(requiredElements).forEach(([name, text]) => {
  if (templatesCode.includes(text)) {
    console.log(`✓ ${name} present`);
  } else {
    console.log(`✗ ${name} missing`);
    allValid = false;
  }
});

// Check for both German and English support
console.log('\nChecking language support...');
if (templatesCode.includes("locale: 'de' | 'en'")) {
  console.log('✓ Dual language support (DE/EN) defined');
} else {
  console.log('✗ Dual language support missing');
  allValid = false;
}

// Check for proper parameter handling
console.log('\nChecking function parameters...');
const parameterChecks = [
  { fn: 'getAdminNotificationTemplate', params: ['locationName', 'submitterEmail', 'submittedAt', 'adminPanelUrl'] },
  { fn: 'getApprovalEmailTemplate', params: ['locationName', 'locale'] },
  { fn: 'getRejectionEmailTemplate', params: ['locationName', 'reason', 'locale'] },
];

parameterChecks.forEach(({ fn, params }) => {
  const fnSignature = templatesCode.match(new RegExp(`function ${fn}\\(([^)]+)\\)`));
  if (fnSignature) {
    const hasAllParams = params.every(param => fnSignature[1].includes(param));
    if (hasAllParams) {
      console.log(`✓ ${fn} has all required parameters`);
    } else {
      console.log(`✗ ${fn} missing some parameters`);
      allValid = false;
    }
  }
});

// Check for email safety (no inline scripts, etc.)
console.log('\nChecking email safety...');
const unsafePatterns = [
  { pattern: /<script/i, name: 'Script tags' },
  { pattern: /javascript:/i, name: 'JavaScript URLs' },
  { pattern: /onerror=/i, name: 'Event handlers' },
];

let isSafe = true;
unsafePatterns.forEach(({ pattern, name }) => {
  if (pattern.test(templatesCode)) {
    console.log(`✗ Found unsafe pattern: ${name}`);
    isSafe = false;
    allValid = false;
  }
});

if (isSafe) {
  console.log('✓ No unsafe patterns detected');
}

// Final result
console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('✓ All validations passed!');
  process.exit(0);
} else {
  console.log('✗ Some validations failed. Please review the code.');
  process.exit(1);
}
