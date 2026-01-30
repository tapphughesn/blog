import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { subscriberHandler } from './functions/subscriber-handler/resource';
import { FunctionUrlAuthType, HttpMethod, Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';

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
    allowedMethods: [HttpMethod.POST],
  },
});

// Grant the Lambda read/write access to the Subscribers table
const subscribersTable = backend.data.resources.tables['Subscribers'];
subscribersTable.grantReadWriteData(subscriberLambda);

// Pass the table name to the Lambda as an environment variable
(subscriberLambda as LambdaFunction).addEnvironment('SUBSCRIBERS_TABLE_NAME', subscribersTable.tableName);

// Output the function URL so we can use it in the frontend
backend.addOutput({
  custom: {
    subscriberFunctionUrl: fnUrl.url,
  },
});
