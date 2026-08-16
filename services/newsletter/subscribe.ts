import "server-only";

import { MongoServerError, type Collection } from "mongodb";

import { getMongoDb } from "@/lib/mongo";

const COLLECTION_NAME = "newsletter";
const DUPLICATE_KEY = 11000;

export interface NewsletterSubscriber {
  email: string;
  subscribedAt: Date;
}

export interface NewsletterSubscriberDto {
  email: string;
  subscribedAt: string;
}

let indexReady: Promise<unknown> | undefined;

async function collection(): Promise<Collection<NewsletterSubscriber>> {
  const db = await getMongoDb();
  const subscribers = db.collection<NewsletterSubscriber>(COLLECTION_NAME);

  indexReady ??= subscribers
    .createIndex({ email: 1 }, { unique: true, name: "email_unique" })
    .catch((error) => {
      console.error("Could not ensure the newsletter email index:", error);
    });

  await indexReady;

  return subscribers;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function addNewsletterSubscriber(
  email: string
): Promise<{ alreadySubscribed: boolean }> {
  const subscribers = await collection();

  try {
    await subscribers.insertOne({ email: normalizeEmail(email), subscribedAt: new Date() });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === DUPLICATE_KEY) {
      return { alreadySubscribed: true };
    }

    throw error;
  }

  return { alreadySubscribed: false };
}

export async function listNewsletterSubscribers(): Promise<NewsletterSubscriberDto[]> {
  const subscribers = await collection();
  const docs = await subscribers
    .find({}, { projection: { _id: 0, email: 1, subscribedAt: 1 } })
    .sort({ subscribedAt: -1 })
    .toArray();

  return docs.map((doc) => ({
    email: doc.email,
    subscribedAt: doc.subscribedAt.toISOString(),
  }));
}

export async function removeNewsletterSubscriber(email: string): Promise<boolean> {
  const subscribers = await collection();
  const result = await subscribers.deleteOne({ email: normalizeEmail(email) });

  return result.deletedCount === 1;
}
