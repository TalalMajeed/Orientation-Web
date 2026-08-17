jest.mock("server-only", () => ({}), { virtual: true });

import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";

type SentAttachment = { name: string; contentType: string; contentBytes: string };
type SentMail = {
  from?: string;
  to: string;
  subject: string;
  body: string;
  attachments?: SentAttachment[];
};
type CampaignModule = typeof import("@/services/email/campaign");

const sent: SentMail[] = [];
let failFor = new Set<string>();
let gate: { email: string; release: () => void; reached: Promise<void> } | null = null;

jest.mock("@/services/email/graph", () => ({
  sendMail: async (options: SentMail) => {
    if (gate && gate.email === options.to) {
      const pending = gate;
      gate = null;
      pending.release();
      await new Promise<void>((resolve) => holdResolvers.push(resolve));
    }

    if (failFor.has(options.to)) {
      throw new Error(`Mailbox unavailable: ${options.to}`);
    }

    sent.push(options);
  },
  isTransientMailError: () => false,
}));

const holdResolvers: (() => void)[] = [];

let mongod: MongoMemoryServer;
let client: MongoClient;
let campaign: CampaignModule;

const recipients = [
  { email: "one@example.com", values: { email_id: "one@example.com", name: "Amal" } },
  { email: "two@example.com", values: { email_id: "two@example.com", name: "Bilal" } },
  { email: "three@example.com", values: { email_id: "three@example.com", name: "Hurrain" } },
];

const sheet = {
  fileName: "data.xlsx",
  columns: ["email_id", "name"],
  recipients,
  skipped: [{ row: 5, value: "not-an-email", reason: "Not a valid email address" }],
};

async function settle(): Promise<Awaited<ReturnType<CampaignModule["readProgress"]>>> {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const progress = await campaign.readProgress();

    if (progress.status !== "running") {
      return progress;
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  throw new Error("Dispatch never finished");
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_DB_URI = mongod.getUri("email-test");
  process.env.EMAIL_SEND_INTERVAL_MS = "1";

  jest.resetModules();
  campaign = await import("@/services/email/campaign");
  client = new MongoClient(process.env.MONGO_DB_URI);
  await client.connect();
});

afterAll(async () => {
  await client?.close();
  const { mongoClientPromise } = await import("@/lib/mongo");
  await (await mongoClientPromise).close();
  await mongod?.stop();
});

beforeEach(async () => {
  sent.length = 0;
  holdResolvers.length = 0;
  failFor = new Set();
  gate = null;
  await client.db("email-test").collection("email_campaigns").deleteMany({});
});

describe("bulk email dispatch", () => {
  it("sends one personalized message per recipient", async () => {
    await campaign.saveSheet(sheet);
    await campaign.saveDraft("Hello {name}", "Hi {name}, your address is {email_id}.");
    await campaign.startDispatch();

    const progress = await settle();

    expect(progress.status).toBe("completed");
    expect(progress.sent).toBe(3);
    expect(progress.failed).toBe(0);
    expect(sent.map((mail) => mail.to)).toEqual([
      "one@example.com",
      "two@example.com",
      "three@example.com",
    ]);
    expect(sent[0].subject).toBe("Hello Amal");
    expect(sent[0].body).toContain("Hi Amal, your address is one@example.com.");
    expect(sent[0].from).toBe(campaign.CAMPAIGN_SENDER);
  });

  it("records failures without stopping the run", async () => {
    failFor = new Set(["two@example.com"]);

    await campaign.saveSheet(sheet);
    await campaign.saveDraft("Subject", "Body");
    await campaign.startDispatch();

    const progress = await settle();

    expect(progress.status).toBe("completed");
    expect(progress.sent).toBe(2);
    expect(progress.failed).toBe(1);
    expect(progress.failures).toEqual([
      { email: "two@example.com", error: "Mailbox unavailable: two@example.com" },
    ]);
  });

  it("cancels mid-run and resumes without resending", async () => {
    let release = () => {};
    const reached = new Promise<void>((resolve) => {
      release = resolve;
    });

    gate = { email: "two@example.com", release, reached };

    await campaign.saveSheet(sheet);
    await campaign.saveDraft("Subject", "Body");
    await campaign.startDispatch();
    await reached;

    await campaign.cancelDispatch();
    holdResolvers.forEach((resolve) => resolve());

    const stopped = await settle();

    expect(stopped.status).toBe("cancelled");
    expect(stopped.cursor).toBeLessThan(3);
    expect(sent.map((mail) => mail.to)).toEqual(["one@example.com", "two@example.com"]);

    await campaign.startDispatch();

    const finished = await settle();

    expect(finished.status).toBe("completed");
    expect(finished.cursor).toBe(3);
    expect(sent.map((mail) => mail.to)).toEqual([
      "one@example.com",
      "two@example.com",
      "three@example.com",
    ]);
  });

  it("sends the same attachments with every email", async () => {
    await campaign.saveSheet(sheet);
    await campaign.saveDraft("Subject", "Body");
    await campaign.addAttachment({
      id: "att-1",
      name: "handbook.pdf",
      contentType: "application/pdf",
      size: 8,
      contentBytes: "aGFuZGJvb2s=",
    });

    const stored = await campaign.readCampaign();

    expect(stored.attachments).toEqual([
      { id: "att-1", name: "handbook.pdf", contentType: "application/pdf", size: 8 },
    ]);
    expect(stored.attachments[0]).not.toHaveProperty("contentBytes");

    await campaign.startDispatch();
    await settle();

    expect(sent).toHaveLength(3);
    for (const mail of sent) {
      expect(mail.attachments).toEqual([
        { name: "handbook.pdf", contentType: "application/pdf", contentBytes: "aGFuZGJvb2s=" },
      ]);
    }
  });

  it("removes an attachment and caps the total size", async () => {
    await campaign.addAttachment({
      id: "att-1",
      name: "a.pdf",
      contentType: "application/pdf",
      size: 2_900_000,
      contentBytes: "AA==",
    });

    await expect(
      campaign.addAttachment({
        id: "att-2",
        name: "b.pdf",
        contentType: "application/pdf",
        size: 500_000,
        contentBytes: "AA==",
      })
    ).rejects.toThrow("must total under");

    const after = await campaign.removeAttachment("att-1");

    expect(after.attachments).toEqual([]);
  });

  it("refuses to dispatch without a list, subject or body", async () => {
    await expect(campaign.startDispatch()).rejects.toBeInstanceOf(campaign.EmailValidationError);

    await campaign.saveSheet(sheet);
    await expect(campaign.startDispatch()).rejects.toThrow("subject is required");

    await campaign.saveDraft("Subject", "");
    await expect(campaign.startDispatch()).rejects.toThrow("body is required");
  });

  it("keeps the draft and skipped rows across reads", async () => {
    await campaign.saveDraft("Subject {name}", "Body");
    await campaign.saveSheet(sheet);

    const stored = await campaign.readCampaign();

    expect(stored.subject).toBe("Subject {name}");
    expect(stored.body).toBe("Body");
    expect(stored.total).toBe(3);
    expect(stored.columns).toEqual(["email_id", "name"]);
    expect(stored.skipped).toHaveLength(1);
    expect(stored.status).toBe("draft");
  });
});
