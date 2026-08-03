import "server-only";

import type { Collection } from "mongodb";

import { getMongoDb } from "@/lib/mongodb";
import type { HuntCodeDoc, HuntScanDoc } from "./types";

export const HUNT_CODES_COLLECTION = "hunt_codes";
export const HUNT_SCANS_COLLECTION = "hunt_scans";

export async function huntCodesCollection(): Promise<Collection<HuntCodeDoc>> {
  const db = await getMongoDb();

  return db.collection<HuntCodeDoc>(HUNT_CODES_COLLECTION);
}

export async function huntScansCollection(): Promise<Collection<HuntScanDoc>> {
  const db = await getMongoDb();

  return db.collection<HuntScanDoc>(HUNT_SCANS_COLLECTION);
}

async function createIndexes(): Promise<void> {
  const [codes, scans] = await Promise.all([
    huntCodesCollection(),
    huntScansCollection(),
  ]);

  await Promise.all([
    codes.createIndex({ code: 1 }, { unique: true }),
    codes.createIndex({ createdAt: -1 }),

    scans.createIndex({ houseId: 1 }),
    scans.createIndex({ scannedAt: -1 }),
    scans.createIndex({ codeId: 1, scannedAt: -1 }),
  ]);
}

let indexPromise: Promise<void> | undefined;

/** Idempotent and memoised, same pattern as the tickets feature. */
export async function ensureHuntIndexes(): Promise<void> {
  if (!indexPromise) {
    indexPromise = createIndexes().catch((error) => {
      indexPromise = undefined;
      throw error;
    });
  }

  return indexPromise;
}
