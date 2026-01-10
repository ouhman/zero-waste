import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { FrontendStack } from '../lib/frontend-stack';

describe('Frontend Stack', () => {
  let app: cdk.App;
  let stack: FrontendStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new FrontendStack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'eu-central-1',
      },
      certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
      domainName: 'map.zerowastefrankfurt.de',
    });
    template = Template.fromStack(stack);
  });

  it('creates S3 bucket', () => {
    // Should create an S3 bucket for static website hosting
    template.resourceCountIs('AWS::S3::Bucket', 1);

    // Bucket should have proper configuration
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it('creates CloudFront distribution', () => {
    // Should create a CloudFront distribution
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);

    // Distribution should have proper configuration
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Enabled: true,
        HttpVersion: 'http2and3',
        PriceClass: 'PriceClass_100', // Use only North America and Europe
        DefaultRootObject: 'index.html',
      },
    });
  });

  it('configures custom domain', () => {
    // Should have domain name configured
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: Match.arrayWith(['map.zerowastefrankfurt.de']),
      },
    });
  });

  it('enables HTTPS', () => {
    // Should use ACM certificate for HTTPS
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        ViewerCertificate: {
          AcmCertificateArn: Match.anyValue(),
          MinimumProtocolVersion: 'TLSv1.2_2021',
          SslSupportMethod: 'sni-only',
        },
      },
    });
  });

  it('configures SPA routing with custom error responses', () => {
    // Should redirect 404s to index.html for SPA routing
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        CustomErrorResponses: Match.arrayWith([
          Match.objectLike({
            ErrorCode: 404,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
          }),
          Match.objectLike({
            ErrorCode: 403,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
          }),
        ]),
      },
    });
  });

  it('uses Origin Access Control (OAC) for S3', () => {
    // Should create OAC for secure S3 access
    template.resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);

    template.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
      OriginAccessControlConfig: {
        Name: Match.anyValue(),
        OriginAccessControlOriginType: 's3',
        SigningBehavior: 'always',
        SigningProtocol: 'sigv4',
      },
    });
  });

  it('configures caching for assets', () => {
    // Should have cache behaviors configured
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: Match.objectLike({
          ViewerProtocolPolicy: 'redirect-to-https',
          Compress: true,
        }),
      },
    });
  });

  it('grants CloudFront access to S3 bucket', () => {
    // Should have bucket policy allowing CloudFront access
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Principal: {
              Service: 'cloudfront.amazonaws.com',
            },
            Action: 's3:GetObject',
          }),
        ]),
      },
    });
  });
});
