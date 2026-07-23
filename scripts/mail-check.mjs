/**
 * Checks the Microsoft Graph mail path before you depend on it.
 *
 *   esecrets run -- node scripts/mail-check.mjs
 *       Acquires an app-only token and reports which application permissions
 *       the tenant actually granted. Sends nothing.
 *
 *   esecrets run -- node scripts/mail-check.mjs you@example.com
 *       Also sends one real test ticket email, with the QR inline (CID) and
 *       attached, so you can confirm it renders — check Gmail specifically.
 *
 * A granted Mail.Send can still fail per-mailbox if the tenant applies an
 * ApplicationAccessPolicy that does not include MS_GRAPH_SENDER. This script
 * distinguishes the two: the roles check covers the grant, the send covers the
 * policy.
 */
import QRCode from "qrcode";

const tenantId = process.env.TENANT_ID;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const sender = process.env.MS_GRAPH_SENDER;
const recipient = process.argv[2];

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

const missing = Object.entries({ TENANT_ID: tenantId, CLIENT_ID: clientId, CLIENT_SECRET: clientSecret })
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missing.length) {
  fail(`Missing: ${missing.join(", ")}`);
}

console.log(`tenant   ${tenantId}`);
console.log(`client   ${clientId}`);
console.log(`sender   ${sender ?? "(MS_GRAPH_SENDER not set)"}`);

// --- token ------------------------------------------------------------
const tokenResponse = await fetch(
  `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
  {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  }
);

const tokenBody = await tokenResponse.json();

if (!tokenResponse.ok) {
  fail(
    `Could not get a token: ${tokenBody.error} — ${tokenBody.error_description?.split("\n")[0]}`
  );
}

console.log("\n✓ App-only token acquired — tenant, client id and secret are all good.");

// The roles claim lists the application permissions the tenant actually
// consented to. This is the answer to "did IT grant Mail.Send?".
const claims = JSON.parse(
  Buffer.from(tokenBody.access_token.split(".")[1], "base64url").toString("utf8")
);
const roles = claims.roles ?? [];

console.log(`\nGranted application permissions: ${roles.length ? roles.join(", ") : "(none)"}`);

if (!roles.includes("Mail.Send")) {
  fail(
    "Mail.Send is NOT granted. A tenant admin must add it as an APPLICATION\n" +
      "  permission on this app registration and click 'Grant admin consent'.\n" +
      "  No code change can work around this."
  );
}

console.log("✓ Mail.Send is granted.");

if (!sender) {
  console.log(
    "\nSet MS_GRAPH_SENDER to the mailbox this app should send as, then re-run\n" +
      "with a recipient to prove the mailbox itself is reachable."
  );
  process.exit(0);
}

if (!recipient) {
  console.log(
    "\nPass a recipient address to send a real test email:\n" +
      "  esecrets run -- node scripts/mail-check.mjs you@example.com"
  );
  process.exit(0);
}

// --- test send ---------------------------------------------------------
const png = await QRCode.toBuffer("OW1:mail-check-not-a-real-ticket", {
  type: "png",
  width: 600,
  margin: 2,
  errorCorrectionLevel: "M",
});
const contentBytes = png.toString("base64");

const sendResponse = await fetch(
  `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenBody.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: "Orientation ticketing — mail path check",
        body: {
          contentType: "HTML",
          content:
            '<p>If you can see the QR code below, inline CID images render in this client.</p>' +
            '<img src="cid:mail-check-qr" width="240" height="240" alt="test QR" />' +
            "<p>The same image is also attached. This is not a real ticket.</p>",
        },
        toRecipients: [{ emailAddress: { address: recipient } }],
        attachments: [
          {
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: "test-qr.png",
            contentType: "image/png",
            contentBytes,
            contentId: "mail-check-qr",
            isInline: true,
          },
          {
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: "test-qr-attachment.png",
            contentType: "image/png",
            contentBytes,
          },
        ],
      },
      saveToSentItems: true,
    }),
  }
);

if (!sendResponse.ok) {
  const error = await sendResponse.text();

  if (sendResponse.status === 403) {
    fail(
      `Mailbox refused (403). Mail.Send is granted, so this is almost certainly an\n` +
        `  ApplicationAccessPolicy in Exchange Online that does not include\n` +
        `  ${sender}. Ask IT to add it to the policy's group.\n\n  ${error}`
    );
  }

  fail(`Send failed (${sendResponse.status}): ${error}`);
}

console.log(`\n✓ Test email sent to ${recipient} from ${sender}.`);
console.log("  Open it in Gmail — that is the client the inline-image bug affects.");
