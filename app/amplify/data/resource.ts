import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Subscribers: a
    .model({
      email: a.string().required(),
      verified: a.boolean(),
      verificationToken: a.string(),
      subscribed: a.boolean(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
