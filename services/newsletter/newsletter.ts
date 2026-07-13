import "server-only";

import { getMongoDb } from "@/lib/mongodb";

const COLLECTION_NAME = "newsletter";

export interface NewsletterSubscriber {
  email: string;
  subscribedAt: Date;
}

export async function addNewsletterSubscriber(
  email: string
): Promise<{ alreadySubscribed: boolean }> {
  const db = await getMongoDb();
  const collection = db.collection<NewsletterSubscriber>(COLLECTION_NAME);

  const existing = await collection.findOne({ email });

  if (existing) {
    return { alreadySubscribed: true };
  }

  await collection.insertOne({ email, subscribedAt: new Date() });

  return { alreadySubscribed: false };
}
