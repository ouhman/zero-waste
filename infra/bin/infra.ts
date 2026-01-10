#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FrontendStack } from '../lib/frontend-stack';
import { EmailStack } from '../lib/email-stack';

const app = new cdk.App();

// Get environment variables or use defaults
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || 'eu-central-1';

// For production, you would provide the ACM certificate ARN
// Certificate must be created in us-east-1 for CloudFront
const certificateArn = process.env.CERTIFICATE_ARN;

const domainName = 'zerowastefrankfurt.de';

// Frontend Stack (S3 + CloudFront)
new FrontendStack(app, 'ZeroWasteFrankfurtStack', {
  env: {
    account: account,
    region: region,
  },
  domainName: `map.${domainName}`,
  certificateArn: certificateArn,
  description: 'Zero Waste Frankfurt - Frontend Infrastructure',
  tags: {
    Project: 'ZeroWasteFrankfurt',
    Environment: process.env.ENVIRONMENT || 'production',
  },
});

// Email Stack (SES)
new EmailStack(app, 'ZeroWasteEmailStack', {
  env: {
    account: account,
    region: region, // SES in eu-central-1 (Frankfurt)
  },
  domainName: domainName,
  notificationEmail: process.env.NOTIFICATION_EMAIL, // Email for bounce/complaint alerts
  description: 'Zero Waste Frankfurt - Email Infrastructure (SES)',
  tags: {
    Project: 'ZeroWasteFrankfurt',
    Environment: process.env.ENVIRONMENT || 'production',
  },
});

app.synth();
