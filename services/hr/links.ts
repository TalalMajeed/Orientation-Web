import "server-only";

import { randomInt } from "crypto";

import { getMongoDb } from "@/lib/mongodb";

const COLLECTION_NAME = "hr_links";
const SHORT_ID_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SHORT_ID_LENGTH = 5;
const MAX_GENERATION_ATTEMPTS = 10;

export const INVITE_BASE_URL = "https://orientation.nust.edu.pk/invite";

export interface HrShortLink {
  shortId: string;
  targetUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HrShortLinkDto {
  shortId: string;
  targetUrl: string;
  shortUrl: string;
  createdAt: string;
  updatedAt: string;
}

export class InvalidUrlError extends Error {}
export class ShortLinkNotFoundError extends Error {}

function toDto(link: HrShortLink): HrShortLinkDto {
  return {
    shortId: link.shortId,
    targetUrl: link.targetUrl,
    shortUrl: `${INVITE_BASE_URL}/${link.shortId}`,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}

export function assertValidHttpsUrl(candidate: string): string {
  let parsed: URL;

  try {
    parsed = new URL(candidate);
  } catch {
    throw new InvalidUrlError("A valid URL is required");
  }

  if (parsed.protocol !== "https:") {
    throw new InvalidUrlError("URL must use https://");
  }

  return parsed.toString();
}

function generateShortId(): string {
  let id = "";

  for (let i = 0; i < SHORT_ID_LENGTH; i++) {
    id += SHORT_ID_ALPHABET[randomInt(SHORT_ID_ALPHABET.length)];
  }

  return id;
}

async function generateUniqueShortId(): Promise<string> {
  const db = await getMongoDb();
  const collection = db.collection<HrShortLink>(COLLECTION_NAME);

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const candidate = generateShortId();
    const existing = await collection.findOne({ shortId: candidate });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Failed to generate a unique short link ID");
}

export async function listShortLinks(): Promise<HrShortLinkDto[]> {
  const db = await getMongoDb();
  const collection = db.collection<HrShortLink>(COLLECTION_NAME);

  const links = await collection.find().sort({ createdAt: -1 }).toArray();

  return links.map(toDto);
}

export async function createShortLink(url: string): Promise<HrShortLinkDto> {
  const targetUrl = assertValidHttpsUrl(url);
  const shortId = await generateUniqueShortId();
  const now = new Date();

  const link: HrShortLink = {
    shortId,
    targetUrl,
    createdAt: now,
    updatedAt: now,
  };

  const db = await getMongoDb();
  const collection = db.collection<HrShortLink>(COLLECTION_NAME);

  await collection.insertOne(link);

  return toDto(link);
}

export async function updateShortLink(
  shortId: string,
  url: string
): Promise<HrShortLinkDto> {
  const targetUrl = assertValidHttpsUrl(url);
  const updatedAt = new Date();

  const db = await getMongoDb();
  const collection = db.collection<HrShortLink>(COLLECTION_NAME);

  const result = await collection.findOneAndUpdate(
    { shortId },
    { $set: { targetUrl, updatedAt } },
    { returnDocument: "after" }
  );

  if (!result) {
    throw new ShortLinkNotFoundError(`No short link found for id ${shortId}`);
  }

  return toDto(result);
}

export async function deleteShortLink(shortId: string): Promise<void> {
  const db = await getMongoDb();
  const collection = db.collection<HrShortLink>(COLLECTION_NAME);

  const result = await collection.deleteOne({ shortId });

  if (result.deletedCount === 0) {
    throw new ShortLinkNotFoundError(`No short link found for id ${shortId}`);
  }
}

export async function resolveShortLink(
  shortId: string
): Promise<string | null> {
  const db = await getMongoDb();
  const collection = db.collection<HrShortLink>(COLLECTION_NAME);

  const link = await collection.findOne({ shortId });

  return link ? link.targetUrl : null;
}
