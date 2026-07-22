/**
 * End-to-end check of the ticketing system against a real mongod and a real
 * Next server. Starts both, drives the HTTP API the way the browser and the
 * gate scanner do, and tears everything down.
 *
 *   npm run e2e
 *
 * Email is deliberately not exercised: without Graph credentials the drain is
 * expected to report a per-recipient failure, and asserting that is itself
 * useful — it proves a failed send never marks a ticket as delivered.
 */
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";

import { MongoClient, ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";

const PORT = Number(process.env.E2E_PORT ?? 3131);
const BASE = `http://127.0.0.1:${PORT}`;
const CREDENTIALS = {
  admin: { username: "e2e-admin", password: "e2e-admin-pass" },
  scanner: { username: "e2e-gate", password: "e2e-gate-pass" },
};

let failures = 0;

function check(label, ok, detail = "") {
  console.log(`${ok ? "  ok  " : " FAIL "} ${label}${detail ? ` — ${detail}` : ""}`);

  if (!ok) {
    failures++;
  }
}

async function login({ username, password }) {
  const response = await fetch(`${BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const body = await response.json().catch(() => ({}));

  return {
    status: response.status,
    role: body.role,
    cookie: (response.headers.getSetCookie() ?? [])
      .map((value) => value.split(";")[0])
      .join("; "),
  };
}

async function api(path, { cookie, method = "GET", body } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const text = await response.text();

  let json = null;

  try {
    json = JSON.parse(text);
  } catch {
    // Not every endpoint returns JSON — the CSV export does not.
  }

  return { status: response.status, json, text, headers: response.headers };
}

async function waitForServer(attempts = 60) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(`${BASE}/login`);

      if (response.ok) {
        return true;
      }
    } catch {
      // Not up yet.
    }

    await sleep(1000);
  }

  return false;
}

/** Drives one ticket through the gate the way a scanned QR would. */
async function attachToken(tickets, ticketId) {
  const token = randomBytes(32).toString("base64url");

  await tickets.updateOne(
    { _id: new ObjectId(ticketId) },
    { $push: { tokenHashes: createHash("sha256").update(token).digest("hex") } }
  );

  return token;
}

async function run(tickets) {
  const admin = await login(CREDENTIALS.admin);
  const scanner = await login(CREDENTIALS.scanner);

  // --- auth and roles --------------------------------------------------
  check("admin login yields the admin role", admin.role === "admin", admin.role);
  check("scanner login yields the scanner role", scanner.role === "scanner");
  check(
    "a wrong password is rejected",
    (await login({ username: CREDENTIALS.admin.username, password: "nope" })).status === 401
  );
  check(
    "an unauthenticated API call is 401",
    (await api("/api/v1/event-tickets?eventId=x")).status === 401
  );

  const guarded = await api("/event-tickets");
  check(
    "an unauthenticated page redirects to login",
    guarded.status === 307 && (guarded.headers.get("location") ?? "").includes("/login")
  );
  check(
    "a scanner cannot read the ticket list",
    (await api("/api/v1/event-tickets?eventId=x", { cookie: scanner.cookie })).status === 401
  );
  check(
    "a role rewritten in the cookie is rejected",
    (
      await api("/api/v1/event-tickets?eventId=x", {
        cookie: scanner.cookie.replace("scanner", "admin"),
      })
    ).status === 401
  );

  // --- events ----------------------------------------------------------
  const created = await api("/api/v1/events", {
    cookie: admin.cookie,
    method: "POST",
    body: { name: "E2E Orientation", venue: "Jinnah Auditorium" },
  });
  check("an admin can create an event", created.status === 201);

  const eventId = created.json?.event?.id;
  check(
    "a scanner can list events to pick its gate",
    (await api("/api/v1/events", { cookie: scanner.cookie })).status === 200
  );

  // --- issuing ---------------------------------------------------------
  const issued = await api("/api/v1/event-tickets", {
    cookie: admin.cookie,
    method: "POST",
    body: { eventId, holderName: "Ali Khan", email: "ali@nust.edu.pk", sendEmail: false },
  });
  check("a ticket is issued", issued.status === 201, issued.text.slice(0, 120));
  check(
    "the response carries a QR image",
    (issued.json?.qrDataUrl ?? "").startsWith("data:image/png;base64,")
  );
  check(
    "the response exposes no raw token field",
    !("token" in (issued.json ?? {})) && !("token" in (issued.json?.ticket ?? {}))
  );
  check(
    "a duplicate email for the same event is refused",
    (
      await api("/api/v1/event-tickets", {
        cookie: admin.cookie,
        method: "POST",
        body: {
          eventId,
          holderName: "Ali Khan",
          email: "  ALI@NUST.edu.pk ",
          sendEmail: false,
        },
      })
    ).status === 409
  );

  // --- check-in --------------------------------------------------------
  const token = await attachToken(tickets, issued.json.ticket.id);

  const first = await api("/api/v1/checkin", {
    cookie: scanner.cookie,
    method: "POST",
    body: { token: `OW1:${token}`, eventId, gate: "main-gate" },
  });
  check("a first scan admits", first.json?.result === "valid", first.text.slice(0, 120));
  check("the panel gets the holder name", first.json?.holderName === "Ali Khan");
  check("the scanner gets a running count", first.json?.checkedInCount === 1);

  const second = await api("/api/v1/checkin", {
    cookie: scanner.cookie,
    method: "POST",
    body: { token: `OW1:${token}`, eventId, gate: "side-gate" },
  });
  check("a second scan is refused", second.json?.result === "already_used");
  check("the refusal names the first gate", second.json?.usedGate === "main-gate");
  check(
    "an unknown token is not_found",
    (
      await api("/api/v1/checkin", {
        cookie: scanner.cookie,
        method: "POST",
        body: { token: "OW1:nope", eventId, gate: "main-gate" },
      })
    ).json?.result === "not_found"
  );

  // --- the race, end to end --------------------------------------------
  const raceTicket = await api("/api/v1/event-tickets", {
    cookie: admin.cookie,
    method: "POST",
    body: { eventId, holderName: "Race Test", email: "race@nust.edu.pk", sendEmail: false },
  });
  const raceToken = await attachToken(tickets, raceTicket.json.ticket.id);

  const raced = await Promise.all(
    Array.from({ length: 10 }, () =>
      api("/api/v1/checkin", {
        cookie: scanner.cookie,
        method: "POST",
        body: { token: `OW1:${raceToken}`, eventId, gate: "race" },
      })
    )
  );
  const winners = raced.filter((result) => result.json?.result === "valid").length;
  check("exactly one of ten simultaneous scans wins", winners === 1, `winners=${winners}`);

  // --- gate fallback ----------------------------------------------------
  const manualTicket = await api("/api/v1/event-tickets", {
    cookie: admin.cookie,
    method: "POST",
    body: { eventId, holderName: "Dead Phone", email: "dead@nust.edu.pk", sendEmail: false },
  });

  const search = await api(`/api/v1/event-tickets/search?eventId=${eventId}&q=dead`, {
    cookie: scanner.cookie,
  });
  check(
    "a scanner can search for someone whose QR will not scan",
    search.status === 200 && search.json.tickets.length === 1
  );
  check(
    "search refuses a one-character query",
    (await api(`/api/v1/event-tickets/search?eventId=${eventId}&q=a`, {
      cookie: scanner.cookie,
    })).status === 400
  );

  const manualBody = { ticketId: manualTicket.json.ticket.id, eventId, gate: "main-gate" };
  check(
    "manual check-in admits",
    (
      await api("/api/v1/checkin/manual", {
        cookie: scanner.cookie,
        method: "POST",
        body: manualBody,
      })
    ).json?.result === "valid"
  );
  check(
    "manual check-in cannot double-admit",
    (
      await api("/api/v1/checkin/manual", {
        cookie: scanner.cookie,
        method: "POST",
        body: manualBody,
      })
    ).json?.result === "already_used"
  );

  // --- bulk and the send queue -------------------------------------------
  const bulk = await api("/api/v1/event-tickets/bulk", {
    cookie: admin.cookie,
    method: "POST",
    body: {
      eventId,
      csv: [
        "name,email",
        "Bulk One,one@nust.edu.pk",
        "Bulk Two,two@nust.edu.pk",
        "Bad Row,not-an-email",
        "Ali Khan,ali@nust.edu.pk",
      ].join("\n"),
    },
  });
  check("bulk queues the good rows", bulk.json?.queued === 2);
  check("bulk explains the bad rows", bulk.json?.failed === 2);

  const drain = await api("/api/v1/event-tickets/drain", {
    cookie: admin.cookie,
    method: "POST",
    body: { eventId, limit: 2 },
  });
  check(
    "a send failure is reported per recipient, not swallowed",
    drain.status === 200 && drain.json.failed >= 1,
    drain.json?.outcomes?.[0]?.error
  );

  const stillQueued = await api(`/api/v1/event-tickets/drain?eventId=${eventId}`, {
    cookie: admin.cookie,
  });
  check(
    "a failed send leaves the ticket queued rather than marked delivered",
    stillQueued.json?.remaining >= 1,
    String(stillQueued.json?.remaining)
  );

  // --- lifecycle ---------------------------------------------------------
  check(
    "a used ticket cannot be revoked",
    (
      await api(`/api/v1/event-tickets/${manualTicket.json.ticket.id}`, {
        cookie: admin.cookie,
        method: "DELETE",
      })
    ).status === 409
  );

  const bulkOne = await tickets.findOne({
    email: "one@nust.edu.pk",
    eventId: new ObjectId(eventId),
  });
  check(
    "an issued ticket can be revoked",
    (
      await api(`/api/v1/event-tickets/${bulkOne._id.toHexString()}`, {
        cookie: admin.cookie,
        method: "DELETE",
      })
    ).status === 200
  );
  check(
    "revoking clears activeKey",
    (await tickets.findOne({ _id: bulkOne._id })).activeKey === undefined
  );
  check(
    "the revoked person can be issued a fresh ticket",
    (
      await api("/api/v1/event-tickets", {
        cookie: admin.cookie,
        method: "POST",
        body: {
          eventId,
          holderName: "Bulk One",
          email: "one@nust.edu.pk",
          sendEmail: false,
        },
      })
    ).status === 201
  );

  // --- export -------------------------------------------------------------
  const exported = await api(`/api/v1/event-tickets/export?eventId=${eventId}`, {
    cookie: admin.cookie,
  });
  check(
    "the CSV export downloads",
    exported.status === 200 &&
      (exported.headers.get("content-type") ?? "").includes("text/csv") &&
      exported.text.includes("Ali Khan")
  );
  check(
    "a scanner cannot export the attendee list",
    (
      await api(`/api/v1/event-tickets/export?eventId=${eventId}`, {
        cookie: scanner.cookie,
      })
    ).status === 401
  );

  // --- secrecy -------------------------------------------------------------
  const stored = JSON.stringify(await tickets.find({}).toArray());
  check(
    "no raw token is stored anywhere",
    !stored.includes(token) && !stored.includes(raceToken)
  );
}

let mongod;
let server;
let client;

try {
  console.log("starting mongod…");
  mongod = await MongoMemoryServer.create({ instance: { dbName: "orientation-e2e" } });
  const uri = mongod.getUri("orientation-e2e");

  console.log(`starting next on ${BASE}…`);
  server = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    env: {
      ...process.env,
      MONGO_DB_URI: uri,
      HR_SESSION_SECRET: "e2e-session-secret",
      HR_USERNAME: CREDENTIALS.admin.username,
      HR_PASSWORD: CREDENTIALS.admin.password,
      SCANNER_USERNAME: CREDENTIALS.scanner.username,
      SCANNER_PASSWORD: CREDENTIALS.scanner.password,
    },
    stdio: "ignore",
  });

  if (!(await waitForServer())) {
    throw new Error("the dev server never became ready");
  }

  client = new MongoClient(uri);
  await client.connect();

  console.log("");
  await run(client.db().collection("event_tickets"));
} finally {
  await client?.close();
  server?.kill("SIGTERM");
  await mongod?.stop();
}

console.log(`\n${failures === 0 ? "all checks passed" : `${failures} check(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);
