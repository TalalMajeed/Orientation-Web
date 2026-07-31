/**
 * These run against a REAL mongod via mongodb-memory-server, not a mock.
 * Single-document atomicity holds on a standalone server, so no replica set is
 * needed — and that atomicity is the entire correctness argument for this app.
 */
import { MongoMemoryServer } from "mongodb-memory-server";

type TicketsModule = typeof import("@/services/tickets/tickets");
type EventsModule = typeof import("@/services/tickets/events");
type DbModule = typeof import("@/services/tickets/db");
type MongoModule = typeof import("@/lib/mongodb");

let mongod: MongoMemoryServer;
let tickets: TicketsModule;
let events: EventsModule;
let db: DbModule;
let mongo: MongoModule;

const GATE = "main-gate";

async function makeEvent(name = "Orientation Day 1") {
  const event = await events.createEvent({ name });
  const eventId = events.toObjectId(event.id);

  if (!eventId) {
    throw new Error("createEvent returned an unusable id");
  }

  return eventId;
}

/** issueTicket returns `token: string | null`; these cases always mint one. */
async function issue(input: Parameters<TicketsModule["issueTicket"]>[0]) {
  const { ticket, token } = await tickets.issueTicket(input);

  if (!token) {
    throw new Error("expected issueTicket to mint a token");
  }

  return { ticket, token };
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  // lib/mongodb reads this at import time, so it must be set before the
  // dynamic imports below.
  process.env.MONGO_DB_URI = mongod.getUri("orientation-test");

  tickets = await import("@/services/tickets/tickets");
  events = await import("@/services/tickets/events");
  db = await import("@/services/tickets/db");
  mongo = await import("@/lib/mongodb");
});

afterAll(async () => {
  const client = await mongo.getMongoClient();

  await client.close();
  await mongod.stop();
});

beforeEach(async () => {
  // deleteMany rather than drop, so the indexes under test survive.
  const [ticketsCol, eventsCol, scanLogCol] = await Promise.all([
    db.ticketsCollection(),
    db.eventsCollection(),
    db.scanLogCollection(),
  ]);

  await Promise.all([
    ticketsCol.deleteMany({}),
    eventsCol.deleteMany({}),
    scanLogCol.deleteMany({}),
  ]);
});

describe("check-in", () => {
  it("admits once, then reports already used", async () => {
    const eventId = await makeEvent();
    const { token } = await issue({
      eventId,
      holderName: "Ali Khan",
      email: "ali@nust.edu.pk",
    });

    const first = await tickets.checkInByToken(token, { eventId, gate: GATE });
    const second = await tickets.checkInByToken(token, { eventId, gate: GATE });

    expect(first.result).toBe("valid");
    expect(first.holderName).toBe("Ali Khan");
    expect(second.result).toBe("already_used");
    expect(second.usedAt).not.toBeNull();
    expect(second.usedGate).toBe(GATE);
  });

  it("admits exactly one of ten simultaneous scans", async () => {
    const eventId = await makeEvent();
    const { token } = await issue({
      eventId,
      holderName: "Sara Ahmed",
      email: "sara@nust.edu.pk",
    });

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        tickets.checkInByToken(token, { eventId, gate: GATE })
      )
    );

    const valid = results.filter((result) => result.result === "valid");
    const alreadyUsed = results.filter(
      (result) => result.result === "already_used"
    );

    expect(valid).toHaveLength(1);
    expect(alreadyUsed).toHaveLength(9);
  });

  it("reports not found for a token that does not exist", async () => {
    const eventId = await makeEvent();

    const result = await tickets.checkInByToken("not-a-real-token", {
      eventId,
      gate: GATE,
    });

    expect(result.result).toBe("not_found");
    expect(result.holderName).toBeNull();
  });

  it("reports revoked and does not mark the ticket used", async () => {
    const eventId = await makeEvent();
    const { ticket, token } = await issue({
      eventId,
      holderName: "Bilal Rana",
      email: "bilal@nust.edu.pk",
    });

    const ticketId = events.toObjectId(ticket.id)!;
    await tickets.revokeTicket(ticketId);

    const result = await tickets.checkInByToken(token, { eventId, gate: GATE });

    expect(result.result).toBe("revoked");

    const ticketsCol = await db.ticketsCollection();
    const stored = await ticketsCol.findOne({ _id: ticketId });

    expect(stored?.status).toBe("revoked");
    expect(stored?.usedAt).toBeNull();
  });

  it("rejects a ticket presented at another event's gate", async () => {
    const eventId = await makeEvent("Day 1");
    const otherEventId = await makeEvent("Day 2");

    const { token } = await issue({
      eventId,
      holderName: "Hina Malik",
      email: "hina@nust.edu.pk",
    });

    const result = await tickets.checkInByToken(token, {
      eventId: otherEventId,
      gate: GATE,
    });

    expect(result.result).toBe("wrong_event");
  });

  it("logs every scan, including the failures", async () => {
    const eventId = await makeEvent();
    const { token } = await issue({
      eventId,
      holderName: "Usman Tariq",
      email: "usman@nust.edu.pk",
    });

    await tickets.checkInByToken(token, { eventId, gate: GATE });
    await tickets.checkInByToken(token, { eventId, gate: GATE });
    await tickets.checkInByToken("garbage", { eventId, gate: GATE });

    const scanLog = await db.scanLogCollection();
    const rows = await scanLog.find({ eventId }).toArray();

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.result).sort()).toEqual([
      "already_used",
      "not_found",
      "valid",
    ]);
  });
});

describe("manual check-in", () => {
  it("admits once and cannot double-admit", async () => {
    const eventId = await makeEvent();
    const { ticket } = await issue({
      eventId,
      holderName: "Ayesha Noor",
      email: "ayesha@nust.edu.pk",
    });

    const ticketId = events.toObjectId(ticket.id)!;

    const first = await tickets.checkInById(ticketId, { eventId, gate: GATE });
    const second = await tickets.checkInById(ticketId, { eventId, gate: GATE });

    expect(first.result).toBe("valid");
    expect(first.holderName).toBe("Ayesha Noor");
    expect(second.result).toBe("already_used");
  });

  it("cannot admit a ticket already admitted by a scan", async () => {
    const eventId = await makeEvent();
    const { ticket, token } = await issue({
      eventId,
      holderName: "Zainab Riaz",
      email: "zainab@nust.edu.pk",
    });

    await tickets.checkInByToken(token, { eventId, gate: GATE });

    const manual = await tickets.checkInById(events.toObjectId(ticket.id)!, {
      eventId,
      gate: "side-gate",
    });

    expect(manual.result).toBe("already_used");
  });
});

describe("issuing", () => {
  it("rejects a second live ticket for the same person and event", async () => {
    const eventId = await makeEvent();

    await tickets.issueTicket({
      eventId,
      holderName: "Omar Sheikh",
      email: "omar@nust.edu.pk",
    });

    await expect(
      tickets.issueTicket({
        eventId,
        holderName: "Omar Sheikh",
        email: "omar@nust.edu.pk",
      })
    ).rejects.toBeInstanceOf(tickets.DuplicateTicketError);
  });

  it("treats differently cased and padded emails as the same person", async () => {
    const eventId = await makeEvent();

    await tickets.issueTicket({
      eventId,
      holderName: "Fatima Zahra",
      email: "fatima@nust.edu.pk",
    });

    await expect(
      tickets.issueTicket({
        eventId,
        holderName: "Fatima Zahra",
        email: "  Fatima@NUST.edu.pk  ",
      })
    ).rejects.toBeInstanceOf(tickets.DuplicateTicketError);
  });

  it("allows the same person a ticket for a different event", async () => {
    const eventId = await makeEvent("Day 1");
    const otherEventId = await makeEvent("Day 2");

    await tickets.issueTicket({
      eventId,
      holderName: "Hamza Iqbal",
      email: "hamza@nust.edu.pk",
    });

    await expect(
      tickets.issueTicket({
        eventId: otherEventId,
        holderName: "Hamza Iqbal",
        email: "hamza@nust.edu.pk",
      })
    ).resolves.toBeDefined();
  });

  it("frees the person for a fresh ticket once revoked", async () => {
    const eventId = await makeEvent();
    const { ticket } = await issue({
      eventId,
      holderName: "Nadia Aslam",
      email: "nadia@nust.edu.pk",
    });

    await tickets.revokeTicket(events.toObjectId(ticket.id)!);

    await expect(
      tickets.issueTicket({
        eventId,
        holderName: "Nadia Aslam",
        email: "nadia@nust.edu.pk",
      })
    ).resolves.toBeDefined();
  });

  it("does not free a person who has already attended", async () => {
    const eventId = await makeEvent();
    const { token } = await issue({
      eventId,
      holderName: "Kashif Javed",
      email: "kashif@nust.edu.pk",
    });

    await tickets.checkInByToken(token, { eventId, gate: GATE });

    await expect(
      tickets.issueTicket({
        eventId,
        holderName: "Kashif Javed",
        email: "kashif@nust.edu.pk",
      })
    ).rejects.toBeInstanceOf(tickets.DuplicateTicketError);
  });
});

describe("resend", () => {
  it("keeps the previously emailed QR working", async () => {
    const eventId = await makeEvent();
    const { ticket, token: originalToken } = await issue({
      eventId,
      holderName: "Imran Baig",
      email: "imran@nust.edu.pk",
    });

    const { token: newToken } = await tickets.mintTicketToken(
      events.toObjectId(ticket.id)!
    );

    expect(newToken).not.toBe(originalToken);

    const result = await tickets.checkInByToken(originalToken, {
      eventId,
      gate: GATE,
    });

    expect(result.result).toBe("valid");
  });

  it("still admits only once across both tokens", async () => {
    const eventId = await makeEvent();
    const { ticket, token: originalToken } = await issue({
      eventId,
      holderName: "Rabia Sultan",
      email: "rabia@nust.edu.pk",
    });

    const { token: newToken } = await tickets.mintTicketToken(
      events.toObjectId(ticket.id)!
    );

    const first = await tickets.checkInByToken(newToken, { eventId, gate: GATE });
    const second = await tickets.checkInByToken(originalToken, {
      eventId,
      gate: GATE,
    });

    expect(first.result).toBe("valid");
    expect(second.result).toBe("already_used");
  });

  it("re-queues the ticket for sending", async () => {
    const eventId = await makeEvent();
    const { ticket } = await issue({
      eventId,
      holderName: "Adeel Raza",
      email: "adeel@nust.edu.pk",
    });

    const ticketId = events.toObjectId(ticket.id)!;
    const ticketsCol = await db.ticketsCollection();

    await ticketsCol.updateOne(
      { _id: ticketId },
      { $set: { emailSentAt: new Date() } }
    );

    await tickets.requeueTicketEmail(ticketId);

    const stored = await ticketsCol.findOne({ _id: ticketId });

    expect(stored?.emailSentAt).toBeNull();
    expect(stored?.emailAttempts).toBe(0);
  });
});

describe("outbox", () => {
  it("keeps token-less bulk rows out of each other's way", async () => {
    const eventId = await makeEvent();

    // A plain unique index would collide here: a missing field indexes as a
    // single null key, so the second insert would be rejected.
    await tickets.issueTicket({
      eventId,
      holderName: "Bulk One",
      email: "one@nust.edu.pk",
      mintToken: false,
    });

    await expect(
      tickets.issueTicket({
        eventId,
        holderName: "Bulk Two",
        email: "two@nust.edu.pk",
        mintToken: false,
      })
    ).resolves.toMatchObject({ token: null });
  });

  it("mints a token at send time for a bulk row", async () => {
    const eventId = await makeEvent();
    const { ticket } = await tickets.issueTicket({
      eventId,
      holderName: "Bulk Three",
      email: "three@nust.edu.pk",
      mintToken: false,
    });

    const ticketId = events.toObjectId(ticket.id)!;
    const { token } = await tickets.mintTicketToken(ticketId);

    await expect(
      tickets.checkInByToken(token, { eventId, gate: GATE })
    ).resolves.toMatchObject({ result: "valid" });
  });

  it("drains in order and stops offering sent tickets", async () => {
    const eventId = await makeEvent();

    for (const name of ["A", "B", "C"]) {
      await tickets.issueTicket({
        eventId,
        holderName: name,
        email: `${name.toLowerCase()}@nust.edu.pk`,
        mintToken: false,
      });
    }

    const firstBatch = await tickets.claimUnsentTickets(eventId, 2);
    expect(firstBatch.map((doc) => doc.holderName)).toEqual(["A", "B"]);

    for (const doc of firstBatch) {
      await tickets.markEmailSent(doc._id);
    }

    await expect(tickets.countUnsentTickets(eventId)).resolves.toBe(1);
  });

  it("stops retrying a ticket that keeps failing", async () => {
    const eventId = await makeEvent();
    const { ticket } = await issue({
      eventId,
      holderName: "Unreachable",
      email: "unreachable@nust.edu.pk",
    });

    const ticketId = events.toObjectId(ticket.id)!;

    for (let attempt = 0; attempt < tickets.MAX_EMAIL_ATTEMPTS; attempt++) {
      await tickets.markEmailFailed(ticketId, "mailbox unavailable");
    }

    await expect(tickets.countUnsentTickets(eventId)).resolves.toBe(0);

    // The resend button gives it a fresh set of attempts.
    await tickets.requeueTicketEmail(ticketId);
    await expect(tickets.countUnsentTickets(eventId)).resolves.toBe(1);
  });

  it("never offers a revoked ticket to the sender", async () => {
    const eventId = await makeEvent();
    const { ticket } = await issue({
      eventId,
      holderName: "Cancelled",
      email: "cancelled@nust.edu.pk",
    });

    await tickets.revokeTicket(events.toObjectId(ticket.id)!);

    await expect(tickets.countUnsentTickets(eventId)).resolves.toBe(0);
  });
});

/**
 * The lease is what stops two drains — two open tabs, or a tab racing a
 * scheduled job — from emailing the same person twice. Minting appends to
 * tokenHashes rather than replacing, so a duplicate send is silent: both QRs
 * work, and single-use still holds, so nothing downstream reveals the mistake.
 */
describe("send lease", () => {
  type EventId = Parameters<TicketsModule["claimUnsentTickets"]>[0];

  async function bulkRoster(eventId: EventId, names: string[]) {
    for (const name of names) {
      await tickets.issueTicket({
        eventId,
        holderName: name,
        email: `${name.toLowerCase()}@nust.edu.pk`,
        mintToken: false,
      });
    }
  }

  it("never hands the same ticket to two concurrent drains", async () => {
    const eventId = await makeEvent();
    await bulkRoster(eventId, ["A", "B", "C", "D"]);

    const [first, second] = await Promise.all([
      tickets.claimUnsentTickets(eventId, 4),
      tickets.claimUnsentTickets(eventId, 4),
    ]);

    const ids = [...first, ...second].map((doc) => doc._id.toHexString());

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(4);
  });

  it("does not re-offer a ticket that is already in flight", async () => {
    const eventId = await makeEvent();
    await bulkRoster(eventId, ["A", "B"]);

    const claimed = await tickets.claimUnsentTickets(eventId, 2);
    expect(claimed).toHaveLength(2);

    await expect(tickets.claimUnsentTickets(eventId, 2)).resolves.toHaveLength(0);

    // Still owed an email, though — an in-flight ticket is not a sent one.
    await expect(tickets.countUnsentTickets(eventId)).resolves.toBe(2);
  });

  it("reclaims a lease left behind by a drain that died", async () => {
    const eventId = await makeEvent();
    await bulkRoster(eventId, ["Stranded"]);

    const [claimed] = await tickets.claimUnsentTickets(eventId, 1);
    const ticketsCol = await db.ticketsCollection();

    // Simulates the crash: the row stays claimed and nothing ever releases it.
    await ticketsCol.updateOne(
      { _id: claimed._id },
      {
        $set: {
          sendingSince: new Date(Date.now() - tickets.SEND_LEASE_MS - 1_000),
        },
      }
    );

    const reclaimed = await tickets.claimUnsentTickets(eventId, 1);

    expect(reclaimed.map((doc) => doc._id.toHexString())).toEqual([
      claimed._id.toHexString(),
    ]);
  });

  it("claims a row written before the lease field existed", async () => {
    const eventId = await makeEvent();
    await bulkRoster(eventId, ["Legacy"]);

    const ticketsCol = await db.ticketsCollection();
    await ticketsCol.updateOne({ eventId }, { $unset: { sendingSince: "" } });

    // Mongo matches a missing field as null, which is what makes the claim
    // filter work on rows that predate this deployment — no migration needed.
    await expect(tickets.claimUnsentTickets(eventId, 1)).resolves.toHaveLength(1);
  });

  it("frees a released claim for the next batch immediately", async () => {
    const eventId = await makeEvent();
    await bulkRoster(eventId, ["Throttled"]);

    const claimed = await tickets.claimUnsentTickets(eventId, 1);
    await tickets.releaseTicketClaims(claimed.map((doc) => doc._id));

    await expect(tickets.claimUnsentTickets(eventId, 1)).resolves.toHaveLength(1);
  });

  it("frees a failed ticket for retry without waiting out the lease", async () => {
    const eventId = await makeEvent();
    await bulkRoster(eventId, ["Bounced"]);

    const [claimed] = await tickets.claimUnsentTickets(eventId, 1);
    await tickets.markEmailFailed(claimed._id, "mailbox full");

    await expect(tickets.claimUnsentTickets(eventId, 1)).resolves.toHaveLength(1);
  });

  it("drops the lease once the ticket is sent", async () => {
    const eventId = await makeEvent();
    await bulkRoster(eventId, ["Delivered"]);

    const [claimed] = await tickets.claimUnsentTickets(eventId, 1);
    await tickets.markEmailSent(claimed._id);

    const ticketsCol = await db.ticketsCollection();
    const stored = await ticketsCol.findOne({ _id: claimed._id });

    expect(stored?.sendingSince).toBeNull();
    await expect(tickets.claimUnsentTickets(eventId, 1)).resolves.toHaveLength(0);
  });

  it("resend clears a lease, so a stranded ticket is sendable at once", async () => {
    const eventId = await makeEvent();
    await bulkRoster(eventId, ["Stuck"]);

    const [claimed] = await tickets.claimUnsentTickets(eventId, 1);
    await tickets.requeueTicketEmail(claimed._id);

    await expect(tickets.claimUnsentTickets(eventId, 1)).resolves.toHaveLength(1);
  });
});

/**
 * A ticket that burns every attempt disappears from the queue depth, so these
 * counts are the only thing standing between a mistyped address and someone
 * being turned away at the gate.
 */
describe("delivery visibility", () => {
  async function exhaust(ticketId: Parameters<TicketsModule["markEmailFailed"]>[0]) {
    for (let attempt = 0; attempt < tickets.MAX_EMAIL_ATTEMPTS; attempt++) {
      await tickets.markEmailFailed(ticketId, "550 no such mailbox");
    }
  }

  it("counts the tickets the drain has given up on", async () => {
    const eventId = await makeEvent();
    const { ticket: doomed } = await issue({
      eventId,
      holderName: "Typo",
      email: "typo@nust.edu.pk",
    });
    await issue({
      eventId,
      holderName: "Fine",
      email: "fine@nust.edu.pk",
    });

    await exhaust(events.toObjectId(doomed.id)!);

    const stats = await tickets.getTicketStats(eventId);

    expect(stats.undeliverable).toBe(1);
    // The trap this exists to catch: nothing is waiting, yet someone is missing.
    expect(stats.unsent).toBe(1);
  });

  it("reports a delivery state the browser can render without the retry cap", async () => {
    const eventId = await makeEvent();
    const { ticket } = await issue({
      eventId,
      holderName: "States",
      email: "states@nust.edu.pk",
    });

    const ticketId = events.toObjectId(ticket.id)!;
    const read = async () =>
      (await tickets.listTickets({ eventId })).tickets[0].delivery;

    await expect(read()).resolves.toBe("queued");

    await tickets.markEmailFailed(ticketId, "temporary failure");
    await expect(read()).resolves.toBe("retrying");

    await exhaust(ticketId);
    await expect(read()).resolves.toBe("undeliverable");

    await tickets.requeueTicketEmail(ticketId);
    await tickets.markEmailSent(ticketId);
    await expect(read()).resolves.toBe("sent");
  });

  it("filters down to the people who never got an email", async () => {
    const eventId = await makeEvent();

    const { ticket: failed } = await issue({
      eventId,
      holderName: "Failed",
      email: "failed@nust.edu.pk",
    });
    const { ticket: sent } = await issue({
      eventId,
      holderName: "Sent",
      email: "sent@nust.edu.pk",
    });
    await issue({
      eventId,
      holderName: "Waiting",
      email: "waiting@nust.edu.pk",
    });

    await tickets.markEmailFailed(events.toObjectId(failed.id)!, "bounced");
    await tickets.markEmailSent(events.toObjectId(sent.id)!);

    // Not "Waiting": a ticket nobody has tried to send yet is not a problem.
    const undelivered = await tickets.listTickets({
      eventId,
      delivery: "undelivered",
    });

    expect(undelivered.tickets.map((row) => row.holderName)).toEqual(["Failed"]);

    const givenUp = await tickets.listTickets({
      eventId,
      delivery: "undeliverable",
    });

    expect(givenUp.tickets).toHaveLength(0);

    await exhaust(events.toObjectId(failed.id)!);

    await expect(
      tickets
        .listTickets({ eventId, delivery: "undeliverable" })
        .then((result) => result.tickets.map((row) => row.holderName))
    ).resolves.toEqual(["Failed"]);
  });

  it("does not chase an email for a revoked ticket", async () => {
    const eventId = await makeEvent();
    const { ticket } = await issue({
      eventId,
      holderName: "Cancelled",
      email: "cancelled@nust.edu.pk",
    });

    const ticketId = events.toObjectId(ticket.id)!;

    await tickets.markEmailFailed(ticketId, "bounced");
    await tickets.revokeTicket(ticketId);

    const undelivered = await tickets.listTickets({
      eventId,
      delivery: "undelivered",
    });

    expect(undelivered.tickets).toHaveLength(0);
  });
});

describe("token secrecy", () => {
  it("never exposes a raw token in a stored document or a response", async () => {
    const eventId = await makeEvent();
    const { ticket, token } = await issue({
      eventId,
      holderName: "Sana Yousaf",
      email: "sana@nust.edu.pk",
    });

    expect(JSON.stringify(ticket)).not.toContain(token);

    const response = await tickets.checkInByToken(token, { eventId, gate: GATE });
    expect(JSON.stringify(response)).not.toContain(token);

    const ticketsCol = await db.ticketsCollection();
    const stored = await ticketsCol.findOne({
      _id: events.toObjectId(ticket.id)!,
    });

    expect(JSON.stringify(stored)).not.toContain(token);

    const scanLog = await db.scanLogCollection();
    const rows = await scanLog.find({}).toArray();

    expect(JSON.stringify(rows)).not.toContain(token);
  });
});

describe("stats", () => {
  it("counts issued, used and revoked per event", async () => {
    const eventId = await makeEvent();

    const first = await tickets.issueTicket({
      eventId,
      holderName: "A",
      email: "a@nust.edu.pk",
    });
    await tickets.issueTicket({
      eventId,
      holderName: "B",
      email: "b@nust.edu.pk",
    });
    const third = await tickets.issueTicket({
      eventId,
      holderName: "C",
      email: "c@nust.edu.pk",
    });

    await tickets.checkInByToken(first.token, { eventId, gate: GATE });
    await tickets.revokeTicket(events.toObjectId(third.ticket.id)!);

    await expect(tickets.getTicketStats(eventId)).resolves.toEqual({
      total: 3,
      issued: 1,
      used: 1,
      revoked: 1,
      // issueTicket does not send — only the live, un-emailed one is owed a mail.
      unsent: 1,
      undeliverable: 0,
    });
  });
});
