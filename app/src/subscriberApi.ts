import outputs from "../amplify_outputs.json";

const BASE_URL = outputs.custom.subscriberFunctionUrl;

export async function subscribe(emailAddress: string): Promise<number> {
  const response = await fetch(`${BASE_URL}subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailAddress }),
  });
  return response.status;
}

export async function verify(verificationToken: string): Promise<number> {
  const response = await fetch(
    `${BASE_URL}verify?verificationToken=${encodeURIComponent(verificationToken)}`,
    { method: "PATCH" }
  );
  return response.status;
}

export async function unsubscribe(verificationToken: string): Promise<number> {
  const response = await fetch(
    `${BASE_URL}unsubscribe?verificationToken=${encodeURIComponent(verificationToken)}`,
    { method: "DELETE" }
  );
  return response.status;
}
