import "server-only";

import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";

interface GraphConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

function getConfig(): GraphConfig {
  const tenantId = process.env.TENANT_ID;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing required environment variables: TENANT_ID, CLIENT_ID, CLIENT_SECRET"
    );
  }

  return { tenantId, clientId, clientSecret };
}

let msalApp: ConfidentialClientApplication | undefined;

function getMsalApp(): ConfidentialClientApplication {
  if (!msalApp) {
    const { tenantId, clientId, clientSecret } = getConfig();

    msalApp = new ConfidentialClientApplication({
      auth: {
        clientId,
        clientSecret,
        authority: `https://login.microsoftonline.com/${tenantId}`,
      },
    });
  }

  return msalApp;
}

async function getAccessToken(): Promise<string> {
  const result = await getMsalApp().acquireTokenByClientCredential({
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
  replyTo?: string;
  from?: string;
}

export function isTransientMailError(error: unknown): boolean {
  const statusCode = (error as { statusCode?: unknown })?.statusCode;

  return statusCode === 429 || statusCode === 503 || statusCode === 504;
}

export async function sendMail({
  to,
  subject,
  body,
  contentType = "HTML",
  replyTo,
  from,
}: SendMailOptions): Promise<void> {
  const sender = from ?? process.env.MS_GRAPH_SENDER;

  if (!sender) {
    throw new Error("Missing required environment variable: MS_GRAPH_SENDER");
  }

  const recipients = (Array.isArray(to) ? to : [to]).map((address) => ({
    emailAddress: { address },
  }));

  const client = getGraphClient();

  await client.api(`/users/${encodeURIComponent(sender)}/sendMail`).post({
    message: {
      subject,
      body: { contentType, content: body },
      toRecipients: recipients,
      ...(replyTo ? { replyTo: [{ emailAddress: { address: replyTo } }] } : {}),
    },
    saveToSentItems: true,
  });
}
