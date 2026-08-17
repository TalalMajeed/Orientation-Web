import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { MongoMemoryServer } from "mongodb-memory-server";

const PORT = Number(process.env.E2E_PORT ?? 3197);
const BASE = `http://127.0.0.1:${PORT}`;

let fails = 0;

const check = (label, ok, detail = "") => {
  console.log(`${ok ? "  ok  " : " FAIL "} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) fails++;
};

const mongod = await MongoMemoryServer.create();
const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  env: {
    ...process.env,
    MONGO_DB_URI: mongod.getUri("liaison-e2e"),
    HR_USERNAME: "admin",
    HR_PASSWORD: "adminpass",
    HR_SESSION_SECRET: "s3cret",
    LIAISON_USERNAME: "og",
    LIAISON_PASSWORD: "ogpass",
    EMAIL_SEND_INTERVAL_MS: "1",
  },
  stdio: "ignore",
});

for (let i = 0; i < 60; i++) {
  try {
    await fetch(`${BASE}/`);
    break;
  } catch {
    await sleep(500);
  }
}

let cookie = "";

const api = async (path, init = {}) => {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(typeof init.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      "x-forwarded-for": "192.0.2.50",
    },
  });

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];

  const body = await response.json().catch(() => ({}));

  return { status: response.status, body };
};

try {
  let r = await api("/api/v1/liaison/state");
  check("state without a session is 401", r.status === 401);

  r = await api("/api/v1/liaison/email");
  check("emails without a session is 401", r.status === 401);

  r = await api("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "og", password: "ogpass" }),
  });
  check("liaison signs in", r.status === 200 && r.body.role === "liaison", JSON.stringify(r.body));

  r = await api("/api/v1/liaison/state");
  check("state returns 10 seeded houses", r.status === 200 && r.body.state.houses.length === 10);

  const students = Array.from({ length: 90 }, (_, i) => ({
    id: `s${i}`,
    name: `Student ${i}`,
    cmsId: `4500${i}`,
    department: ["SEECS", "NBS", "SMME"][i % 3],
    gender: i % 3 === 0 ? "female" : "male",
    merit: 100 - i,
    houseId: null,
    ogId: null,
  }));

  r = await api("/api/v1/liaison/students", {
    method: "PUT",
    body: JSON.stringify({ students, log: [] }),
  });
  check("upload persists 90 students", r.status === 200 && r.body.state.students.length === 90);

  r = await api("/api/v1/liaison/allocation", { method: "POST" });
  const allocated = r.body.state?.students ?? [];
  check(
    "allocation assigns every student",
    r.status === 200 && allocated.every((s) => s.houseId && s.ogId)
  );

  const sizes = r.body.state.houses.map(
    (h) => allocated.filter((s) => s.houseId === h.id).length
  );
  check("houses are balanced", Math.max(...sizes) - Math.min(...sizes) <= 1, `sizes ${sizes.join(",")}`);

  r = await api("/api/v1/liaison/state");
  check(
    "allocation survived the round trip",
    r.body.state.allocated === true && r.body.state.students[0].houseId
  );

  const houseId = r.body.state.houses[0].id;
  const ogId = r.body.state.houses[0].ogs[0].id;

  r = await api(`/api/v1/liaison/houses/${houseId}`, {
    method: "PATCH",
    body: JSON.stringify({ ol: "Ayesha Khan" }),
  });
  check("OL rename saves", r.body.state.houses[0].ol === "Ayesha Khan");

  r = await api(`/api/v1/liaison/houses/${houseId}`, {
    method: "PATCH",
    body: JSON.stringify({ ogId, name: "Bilal Raza" }),
  });
  check("OG rename saves", r.body.state.houses[0].ogs[0].name === "Bilal Raza");

  r = await api("/api/v1/liaison/houses/does-not-exist", {
    method: "PATCH",
    body: JSON.stringify({ ol: "X" }),
  });
  check("unknown house is 400", r.status === 400, JSON.stringify(r.body));

  r = await api("/api/v1/liaison/config", {
    method: "PATCH",
    body: JSON.stringify({ houseCapacity: 5 }),
  });
  check("capacity saves", r.body.state.config.houseCapacity === 5);

  r = await api("/api/v1/liaison/allocation", { method: "POST" });
  const placed = r.body.state.students.filter((s) => s.houseId).length;
  check("capacity is enforced", placed === 50, `placed ${placed}`);
  check("overflow is reported", r.body.state.log.some((l) => l.type === "overflow"));

  r = await api("/api/v1/liaison/allocation", { method: "DELETE" });
  check(
    "reset clears assignments, keeps roster",
    r.body.state.students.length === 90 && r.body.state.students.every((s) => s.houseId === null)
  );

  r = await api("/api/v1/liaison/houses/reseed", { method: "POST" });
  check("reseed restores placeholder names", r.body.state.houses[0].ol !== "Ayesha Khan");

  r = await api("/api/v1/liaison/state", { method: "DELETE" });
  check("clear all empties the roster", r.body.state.students.length === 0);

  // --- emails -----------------------------------------------------------
  const mailSheet = {
    fileName: "list.xlsx",
    columns: ["email_id", "name", "og_house"],
    recipients: [
      {
        email: "one@example.com",
        values: { email_id: "one@example.com", name: "Amal", og_house: "Khiljis" },
      },
      {
        email: "two@example.com",
        values: { email_id: "two@example.com", name: "Bilal", og_house: "Romans" },
      },
    ],
    skipped: [{ row: 4, value: "Ayela Shahid", reason: "Not a valid email address" }],
  };

  r = await api("/api/v1/liaison/email", { method: "PUT", body: JSON.stringify(mailSheet) });
  check(
    "mailing list uploads",
    r.status === 200 && r.body.campaign.total === 2 && r.body.campaign.skipped.length === 1,
    JSON.stringify(r.body.error ?? "")
  );

  r = await api("/api/v1/liaison/email", {
    method: "PUT",
    body: JSON.stringify({ ...mailSheet, recipients: [{ email: "Amal Imdad", values: {} }] }),
  });
  check("a non-email first column is rejected", r.status === 400);

  r = await api("/api/v1/liaison/email/dispatch", { method: "POST" });
  check("dispatch without a subject is refused", r.status === 400, JSON.stringify(r.body));

  r = await api("/api/v1/liaison/email", {
    method: "PATCH",
    body: JSON.stringify({ subject: "Welcome {name}", body: "Hi {name}, you are in {og_house}." }),
  });
  check("composer draft saves", r.status === 200 && r.body.progress.subject === "Welcome {name}");

  r = await api("/api/v1/liaison/email");
  check(
    "draft and list survive a reload",
    r.body.campaign.body.includes("{og_house}") && r.body.campaign.recipients.length === 2
  );

  const attachment = new FormData();
  attachment.append("file", new File(["handbook"], "handbook.pdf", { type: "application/pdf" }));

  r = await api("/api/v1/liaison/email/attachments", { method: "POST", body: attachment });
  const attached = r.body.campaign?.attachments?.[0];
  check(
    "an attachment uploads without leaking its bytes",
    r.status === 200 &&
      attached?.name === "handbook.pdf" &&
      attached?.size === 8 &&
      attached.contentBytes === undefined,
    JSON.stringify(r.body.error ?? attached ?? "")
  );

  r = await api("/api/v1/liaison/email/dispatch", { method: "POST" });
  check("dispatch starts", r.status === 202 && r.body.progress.status === "running");

  let progress = r.body.progress;
  for (let i = 0; i < 100 && progress.status === "running"; i++) {
    await sleep(100);
    progress = (await api("/api/v1/liaison/email/progress")).body.progress;
  }
  check(
    "every recipient is accounted for",
    progress.status !== "running" && progress.sent + progress.failed === 2,
    `${progress.status} · ${progress.sent} sent · ${progress.failed} failed`
  );

  r = await api("/api/v1/liaison/email/attachments", {
    method: "DELETE",
    body: JSON.stringify({ id: attached?.id }),
  });
  check("an attachment can be removed", r.status === 200 && r.body.campaign.attachments.length === 0);

  r = await api("/api/v1/liaison/email", { method: "DELETE" });
  check("clearing the campaign empties it", r.status === 200 && r.body.campaign.total === 0);

  r = await api("/api/v1/hr/links");
  check("liaison cannot read HR links", r.status === 401);

  const validCookie = cookie;
  cookie = validCookie.replace(/liaison/, "admin");
  r = await api("/api/v1/hr/links");
  check("tampered cookie is rejected", r.status === 401);
  cookie = validCookie;

  let limited = 0;
  for (let i = 0; i < 70; i++) {
    const response = await api("/api/v1/liaison/config", {
      method: "PATCH",
      body: JSON.stringify({ houseCapacity: null }),
    });
    if (response.status === 429) limited++;
  }
  check("write budget kicks in after 60/min", limited >= 9, `${limited} refused`);

  // --- newsletter -------------------------------------------------------
  r = await api("/api/v1/newsletter", {
    method: "POST",
    body: JSON.stringify({ email: "Subscriber@nust.edu.pk" }),
  });
  check("newsletter accepts a new address", r.status === 201, JSON.stringify(r.body));

  r = await api("/api/v1/newsletter", {
    method: "POST",
    body: JSON.stringify({ email: "subscriber@NUST.edu.pk" }),
  });
  check("newsletter reports a repeat address", r.status === 200, JSON.stringify(r.body));

  r = await api("/api/v1/newsletter", {
    method: "POST",
    body: JSON.stringify({ email: "not-an-email" }),
  });
  check("newsletter rejects a malformed address", r.status === 400);

  r = await api("/api/v1/newsletter");
  check("liaison cannot read subscribers", r.status === 401);

  r = await api("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "admin", password: "adminpass" }),
  });
  check("admin signs in", r.status === 200 && r.body.role === "admin");

  r = await api("/api/v1/newsletter");
  check(
    "subscriber was stored once, normalized",
    r.status === 200 && r.body.count === 1 && r.body.subscribers[0].email === "subscriber@nust.edu.pk",
    JSON.stringify(r.body)
  );

  r = await api("/api/v1/newsletter", {
    method: "DELETE",
    body: JSON.stringify({ email: "subscriber@nust.edu.pk" }),
  });
  check("admin can unsubscribe", r.status === 200);

  r = await api("/api/v1/newsletter");
  check("subscriber list is empty again", r.body.count === 0);
} finally {
  server.kill("SIGTERM");
  await mongod.stop();
}

console.log(fails === 0 ? "\nALL CHECKS PASSED" : `\n${fails} CHECK(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
