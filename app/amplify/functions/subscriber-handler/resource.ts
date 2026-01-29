import { defineFunction } from "@aws-amplify/backend";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const functionDir = __dirname;

export const subscriberHandler = defineFunction(
  (scope) =>
    new Function(scope, "subscriber-handler", {
      handler: "handler.handler",
      runtime: Runtime.PYTHON_3_12,
      timeout: Duration.seconds(30),
      code: Code.fromAsset(functionDir),
    })
);
