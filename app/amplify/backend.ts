import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { subscriberHandler } from './functions/subscriber-handler/resource';
import { blogNotifier } from './functions/blog-notifier/resource';
import { FunctionUrlAuthType, HttpMethod, Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { CfnTemplate } from 'aws-cdk-lib/aws-ses';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const backend = defineBackend({
  auth,
  data,
  subscriberHandler,
  blogNotifier,
});

// -------------------------
// subscriberHandler Lambda
// -------------------------

// Create a function URL so the frontend can call the Lambda directly
const subscriberLambda = backend.subscriberHandler.resources.lambda;
const fnUrl = subscriberLambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedHeaders: ['Content-Type'],
    allowedMethods: [HttpMethod.POST, HttpMethod.PATCH, HttpMethod.DELETE],
  },
});

// Grant the Lambda read/write access to the Subscribers table
const subscribersTable = backend.data.resources.tables['Subscribers'];
subscribersTable.grantReadWriteData(subscriberLambda);

// Grant Query permission for the secondary index
subscriberLambda.addToRolePolicy(new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ['dynamodb:Query'],
  resources: [
    subscribersTable.tableArn,
    `${subscribersTable.tableArn}/index/*`
  ],
}));

// Pass the table name to the Lambda as an environment variable
(subscriberLambda as LambdaFunction).addEnvironment('SUBSCRIBERS_TABLE_NAME', subscribersTable.tableName);

// Grant the Lambda permission to send emails via SES
subscriberLambda.addToRolePolicy(new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ['ses:SendEmail', 'ses:SendBulkTemplatedEmail'],
  resources: ['*'],
}));

// Pass the sender email to the Lambda as an environment variable
(subscriberLambda as LambdaFunction).addEnvironment('SES_SENDER_EMAIL', 'subscription-manager@nicholastapphughes.com');

// Pass the sender display name to the Lambda as an environment variable
(subscriberLambda as LambdaFunction).addEnvironment('SES_SENDER_NAME', "Nick Tapp-Hughes's Blog");

// Pass the site domain to the Lambda as an environment variable
(subscriberLambda as LambdaFunction).addEnvironment('SITE_DOMAIN', 'nicholastapphughes.com');

// Output the function URL so we can use it in the frontend
backend.addOutput({
  custom: {
    subscriberFunctionUrl: fnUrl.url,
  },
});

// -------------------------
// blogNotifier Lambda
// -------------------------

// Configure blog notifier Lambda
const notifierLambda = backend.blogNotifier.resources.lambda;

// Grant read-only access to the Subscribers table
subscribersTable.grantReadData(notifierLambda);

// Grant Scan permission for querying all verified subscribers
notifierLambda.addToRolePolicy(new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ['dynamodb:Scan'],
  resources: [subscribersTable.tableArn],
}));

// Grant SES bulk email permission
notifierLambda.addToRolePolicy(new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ['ses:SendBulkTemplatedEmail'],
  resources: ['*'],
}));

// Pass environment variables to blog notifier Lambda
(notifierLambda as LambdaFunction).addEnvironment('SUBSCRIBERS_TABLE_NAME', subscribersTable.tableName);
(notifierLambda as LambdaFunction).addEnvironment('SES_SENDER_EMAIL', 'notifier@nicholastapphughes.com');
(notifierLambda as LambdaFunction).addEnvironment('SES_SENDER_NAME', "Nick Tapp-Hughes's Blog");
(notifierLambda as LambdaFunction).addEnvironment('SITE_DOMAIN', 'nicholastapphughes.com');
(notifierLambda as LambdaFunction).addEnvironment('BLOG_POST_TEMPLATE_NAME', 'BlogPostNotification');

// -------------------------
// SES bulk email template for blogNotifier 
// -------------------------

// Create SES email template from files
const templateDir = join(__dirname, 'functions', 'blog-notifier');
const htmlTemplate = readFileSync(join(templateDir, 'email-template.html'), 'utf-8');
const textTemplate = readFileSync(join(templateDir, 'email-template.txt'), 'utf-8');

new CfnTemplate(notifierLambda, 'BlogPostTemplate', {
  template: {
    templateName: 'BlogPostNotification',
    subjectPart: 'New blog post: {{title}}',
    htmlPart: htmlTemplate,
    textPart: textTemplate,
  },
});

