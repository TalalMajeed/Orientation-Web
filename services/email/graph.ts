import "server-only";

import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";

interface GraphConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

/**
 * Read lazily rather than at import time: a missing variable should fail the
 * one request that sends mail, not every route that happens to import this
 * module.
 */
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

export interface MailAttachment {
  name: string;
  contentType: string;
  /** Base64, without a `data:` prefix. */
  contentBytes: string;
  /**
   * Set alongside isInline to reference the file from the body as
   * `<img src="cid:the-content-id">`. Gmail strips `src="data:..."`, so an
   * inline image has to arrive as a CID attachment to render at all.
   */
  contentId?: string;
  isInline?: boolean;
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  body: string;
  contentType?: "Text" | "HTML";
  attachments?: MailAttachment[];
}

function toGraphAttachment(attachment: MailAttachment) {
  return {
    "@odata.type": "#microsoft.graph.fileAttachment",
    name: attachment.name,
    contentType: attachment.contentType,
    contentBytes: attachment.contentBytes,
    ...(attachment.contentId ? { contentId: attachment.contentId } : {}),
    ...(attachment.isInline ? { isInline: true } : {}),
  };
}

/** Throttling and transient outages deserve a retry, not a spent attempt. */
export function isTransientMailError(error: unknown): boolean {
  const statusCode = (error as { statusCode?: unknown })?.statusCode;

  return statusCode === 429 || statusCode === 503 || statusCode === 504;
}

/**
 * App-only "send as" via Graph /sendMail: there is no signed-in user, so the
 * request has to name the mailbox it speaks for.
 *
 * MS_GRAPH_SENDER must be a mailbox inside the Exchange
 * ApplicationAccessPolicy scope for this app registration. Verified
 * 2026-07-22 against the live tenant: of the four orientation mailboxes only
 * HR@orientation.nust.edu.pk qualifies — info@, it@ and support@ all return
 * ErrorAccessDenied "[RAOP] : Blocked by tenant configured AppOnly
 * AccessPolicy settings". Moving to info@ needs IT to add it to the policy
 * group first; run `npm run mail-check` to confirm.
 */
export async function sendMail({
  to,
  subject,
  body,
  contentType = "HTML",
  attachments = [],
}: SendMailOptions): Promise<void> {
  const sender = process.env.MS_GRAPH_SENDER;

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
      ...(attachments.length
        ? { attachments: attachments.map(toGraphAttachment) }
        : {}),
    },
    saveToSentItems: true,
  });
}
