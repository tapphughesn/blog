import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Subscribers: a
    .model({
      emailAddress: a.string().required(),
      subscribedStatus: a.boolean(),
      verifiedStatus: a.boolean(),
      verificationToken: a.string().required(),
      subscribedAt: a.datetime(),
      verifiedAt: a.datetime(),
    })
    .identifier(['emailAddress'])
    .secondaryIndexes((index) => [
      index("verificationToken")
        .name("ByVerificationToken") 
        .queryField("listSubscribersByToken") 
    ])
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
  },
});
