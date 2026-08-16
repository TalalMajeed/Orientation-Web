jest.mock("server-only", () => ({}), { virtual: true });

import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";

type SubscribeModule = typeof import("@/services/newsletter/subscribe");

let mongod: MongoMemoryServer;
let client: MongoClient;
let subscribe: SubscribeModule;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_DB_URI = mongod.getUri("newsletter-test");

  jest.resetModules();
  subscribe = await import("@/services/newsletter/subscribe");
  client = new MongoClient(process.env.MONGO_DB_URI);
  await client.connect();
});

afterAll(async () => {
  await client?.close();
  const { mongoClientPromise } = await import("@/lib/mongo");
  await (await mongoClientPromise).close();
  await mongod?.stop();
});

const collection = () => client.db("newsletter-test").collection("newsletter");

afterEach(async () => {
  await collection().deleteMany({});
});

describe("newsletter subscribers", () => {
  it("stores a new subscriber in the database", async () => {
    const result = await subscribe.addNewsletterSubscriber("student@nust.edu.pk");

    expect(result.alreadySubscribed).toBe(false);

    const stored = await collection().findOne({ email: "student@nust.edu.pk" });

    expect(stored).not.toBeNull();
    expect(stored?.subscribedAt).toBeInstanceOf(Date);
  });

  it("normalizes case and whitespace before storing", async () => {
    await subscribe.addNewsletterSubscriber("  Student@NUST.edu.pk  ");

    expect(await collection().findOne({ email: "student@nust.edu.pk" })).not.toBeNull();
  });

  it("reports a repeat address instead of duplicating it", async () => {
    await subscribe.addNewsletterSubscriber("student@nust.edu.pk");
    const second = await subscribe.addNewsletterSubscriber("STUDENT@nust.edu.pk");

    expect(second.alreadySubscribed).toBe(true);
    expect(await collection().countDocuments({})).toBe(1);
  });

  it("keeps concurrent submissions of one address to a single row", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => subscribe.addNewsletterSubscriber("race@nust.edu.pk"))
    );

    expect(results.filter((r) => !r.alreadySubscribed)).toHaveLength(1);
    expect(await collection().countDocuments({})).toBe(1);
  });

  it("lists subscribers newest first without leaking _id", async () => {
    await subscribe.addNewsletterSubscriber("first@nust.edu.pk");
    await new Promise((resolve) => setTimeout(resolve, 5));
    await subscribe.addNewsletterSubscriber("second@nust.edu.pk");

    const list = await subscribe.listNewsletterSubscribers();

    expect(list.map((entry) => entry.email)).toEqual([
      "second@nust.edu.pk",
      "first@nust.edu.pk",
    ]);
    expect(typeof list[0].subscribedAt).toBe("string");
    expect(list[0]).not.toHaveProperty("_id");
  });

  it("removes a subscriber and reports a miss", async () => {
    await subscribe.addNewsletterSubscriber("bye@nust.edu.pk");

    expect(await subscribe.removeNewsletterSubscriber("BYE@nust.edu.pk")).toBe(true);
    expect(await subscribe.removeNewsletterSubscriber("bye@nust.edu.pk")).toBe(false);
    expect(await collection().countDocuments({})).toBe(0);
  });
});
