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
      ...(init.body ? { "Content-Type": "application/json" } : {}),
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
} finally {
  server.kill("SIGTERM");
  await mongod.stop();
}

console.log(fails === 0 ? "\nALL CHECKS PASSED" : `\n${fails} CHECK(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
