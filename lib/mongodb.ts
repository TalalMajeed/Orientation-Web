import "server-only";

import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGO_DB_URI;

if (!uri) {
  throw new Error("Missing required environment variable: MONGO_DB_URI");
}

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

const client = new MongoClient(uri);

export const mongoClientPromise =
  globalForMongo.mongoClientPromise ?? client.connect();

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClientPromise = mongoClientPromise;
}

export async function getMongoClient() {
  return mongoClientPromise;
}

export async function getMongoDb(databaseName?: string): Promise<Db> {
  const client = await getMongoClient();

  return databaseName ? client.db(databaseName) : client.db();
}