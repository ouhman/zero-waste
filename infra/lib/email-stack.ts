import * as cdk from 'aws-cdk-lib';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface EmailStackProps extends cdk.StackProps {
  domainName: string;
  notificationEmail?: string; // Email to receive bounce/complaint notifications
}

export class EmailStack extends cdk.Stack {
  public readonly emailIdentity: ses.EmailIdentity;
  public readonly sesUser: iam.User;

  constructor(scope: Construct, id: string, props: EmailStackProps) {
    super(scope, id, props);

    // Create SNS topic for bounce and complaint notifications
    const notificationTopic = new sns.Topic(this, 'SESNotificationTopic', {
      topicName: 'zerowaste-ses-notifications',
      displayName: 'Zero Waste Frankfurt SES Notifications',
    });

    // Subscribe email to notifications if provided
    if (props.notificationEmail) {
      notificationTopic.addSubscription(
        new subscriptions.EmailSubscription(props.notificationEmail)
      );
    }

    // Create SES Email Identity for the domain
    // This requires DNS verification - you'll need to add the CNAME records to your DNS
    this.emailIdentity = new ses.EmailIdentity(this, 'EmailIdentity', {
      identity: ses.Identity.domain(props.domainName),
      // Enable DKIM signing for better deliverability
      dkimSigning: true,
      // Configure bounce and complaint notifications
      mailFromBehaviorOnMxFailure: ses.MailFromBehaviorOnMxFailure.USE_DEFAULT_VALUE,
    });

    // Configure SES to send bounce/complaint notifications to SNS
    // Using CfnConfigurationSet and CfnConfigurationSetEventDestination for notifications
    const configSet = new ses.ConfigurationSet(this, 'ConfigurationSet', {
      configurationSetName: 'zerowaste-config-set',
      reputationMetrics: true,
      sendingEnabled: true,
    });

    // Add SNS event destination for bounces and complaints
    new ses.CfnConfigurationSetEventDestination(this, 'BounceComplaintDestination', {
      configurationSetName: configSet.configurationSetName,
      eventDestination: {
        name: 'bounce-complaint-notifications',
        enabled: true,
        matchingEventTypes: ['bounce', 'complaint', 'reject'],
        snsDestination: {
          topicArn: notificationTopic.topicArn,
        },
      },
    });

    // Create IAM user for Supabase Edge Functions to send emails
    this.sesUser = new iam.User(this, 'SESUser', {
      userName: 'zerowaste-ses-user',
    });

    // Grant the user permission to send emails via SES
    this.sesUser.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ses:SendEmail',
          'ses:SendRawEmail',
        ],
        resources: [
          // Allow sending from the verified domain identity
          `arn:aws:ses:${this.region}:${this.account}:identity/${props.domainName}`,
          // Allow sending to any recipient (required for ses:SendEmail)
          `arn:aws:ses:${this.region}:${this.account}:identity/*`,
        ],
      })
    );

    // Create access key for the IAM user
    const accessKey = new iam.AccessKey(this, 'SESUserAccessKey', {
      user: this.sesUser,
    });

    // Store credentials in SSM Parameter Store (encrypted)
    // These can be retrieved and set as Supabase secrets
    new ssm.StringParameter(this, 'SESAccessKeyId', {
      parameterName: '/zerowaste/ses/access-key-id',
      stringValue: accessKey.accessKeyId,
      description: 'SES IAM User Access Key ID',
    });

    new ssm.StringParameter(this, 'SESSecretAccessKey', {
      parameterName: '/zerowaste/ses/secret-access-key',
      stringValue: accessKey.secretAccessKey.unsafeUnwrap(),
      description: 'SES IAM User Secret Access Key',
    });

    // Outputs
    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: notificationTopic.topicArn,
      description: 'SNS Topic ARN for bounce/complaint notifications',
    });

    new cdk.CfnOutput(this, 'ConfigurationSetName', {
      value: configSet.configurationSetName,
      description: 'SES Configuration Set name (use in Edge Function)',
    });

    new cdk.CfnOutput(this, 'EmailIdentityArn', {
      value: this.emailIdentity.emailIdentityArn,
      description: 'SES Email Identity ARN',
    });

    new cdk.CfnOutput(this, 'SESUserArn', {
      value: this.sesUser.userArn,
      description: 'SES IAM User ARN',
    });

    new cdk.CfnOutput(this, 'DKIMRecords', {
      value: 'Check AWS Console for DKIM CNAME records to add to DNS',
      description: 'DKIM DNS records needed for domain verification',
    });

    new cdk.CfnOutput(this, 'SESRegion', {
      value: this.region,
      description: 'SES Region (use this in Edge Function)',
    });

    // Instructions output
    new cdk.CfnOutput(this, 'NextSteps', {
      value: `
1. Add DKIM CNAME records to DNS (check SES console)
2. Verify domain in SES console
3. Request production access (exit sandbox mode)
4. Get credentials: aws ssm get-parameter --name /zerowaste/ses/access-key-id
5. Set Supabase secrets: supabase secrets set AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=xxx AWS_REGION=${this.region}
      `.trim(),
      description: 'Setup instructions',
    });
  }
}
