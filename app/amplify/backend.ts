import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { subscriberHandler } from './functions/subscriber-handler/resource';
import { FunctionUrlAuthType, HttpMethod, Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
  auth,
  data,
  subscriberHandler,
});

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
