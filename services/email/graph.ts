import "server-only";

import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";

const tenantId = process.env.TENANT_ID;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const sender = process.env.MS_GRAPH_SENDER;

if (!tenantId || !clientId || !clientSecret) {
  throw new Error(
    "Missing required environment variables: TENANT_ID, CLIENT_ID, CLIENT_SECRET"
  );
}

const msalApp = new ConfidentialClientApplication({
  auth: {
    clientId,
    clientSecret,
    authority: `https://login.microsoftonline.com/${tenantId}`,
  },
});

async function getAccessToken(): Promise<string> {
  const result = await msalApp.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });

  if (!result?.accessToken) {
    throw new Error("Failed to acquire Microsoft Graph access token");
  }

  return result.accessToken;
}

function getGraphClient(): Client {
  return Client.init({
    authProvider: (done) => {
      getAccessToken()
        .then((token) => done(null, token))
        .catch((error) => done(error, null));
    },
  });
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  body: string;
  contentType?: "Text" | "HTML";
}

// Tentative: app-only "send as" mailbox via Graph /sendMail. The mailbox in
// MS_GRAPH_SENDER must grant this app registration the Mail.Send application permission.
export async function sendMail({
  to,
  subject,
  body,
  contentType = "HTML",
}: SendMailOptions): Promise<void> {
  if (!sender) {
    throw new Error("Missing required environment variable: MS_GRAPH_SENDER");
  }

  const recipients = (Array.isArray(to) ? to : [to]).map((address) => ({
    emailAddress: { address },
  }));

  const client = getGraphClient();

  await client.api(`/users/${sender}/sendMail`).post({
    message: {
      subject,
      body: { contentType, content: body },
      toRecipients: recipients,
    },
    saveToSentItems: true,
  });
}
