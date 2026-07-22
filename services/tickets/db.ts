import "server-only";

import type { Collection } from "mongodb";

import { getMongoDb } from "@/lib/mongodb";
import type { EventDoc, ScanLogDoc, TicketDoc } from "./types";

export const EVENTS_COLLECTION = "events";
export const TICKETS_COLLECTION = "event_tickets";
export const SCAN_LOG_COLLECTION = "scan_log";

export async function eventsCollection(): Promise<Collection<EventDoc>> {
  const db = await getMongoDb();

  return db.collection<EventDoc>(EVENTS_COLLECTION);
}

export async function ticketsCollection(): Promise<Collection<TicketDoc>> {
  const db = await getMongoDb();

  return db.collection<TicketDoc>(TICKETS_COLLECTION);
}

export async function scanLogCollection(): Promise<Collection<ScanLogDoc>> {
  const db = await getMongoDb();

  return db.collection<ScanLogDoc>(SCAN_LOG_COLLECTION);
}

async function createIndexes(): Promise<void> {
  const [events, tickets, scanLog] = await Promise.all([
    eventsCollection(),
    ticketsCollection(),
    scanLogCollection(),
  ]);

  await Promise.all([
    events.createIndex({ createdAt: -1 }),

    // A token hash may never be shared between two tickets. Unique applies
    // across array elements, so this holds for every token ever issued.
    // Partial, because a missing field (and an empty array) indexes as a
    // single null key — without this, two token-less rows awaiting their
    // first send would collide with each other.
    tickets.createIndex(
      { tokenHashes: 1 },
      {
        unique: true,
        partialFilterExpression: { tokenHashes: { $exists: true } },
      }
    ),

    // One live ticket per person per event. Mongo's partialFilterExpression
    // rejects $ne, so liveness is expressed by the presence of activeKey
    // rather than by a predicate on status.
    tickets.createIndex(
      { activeKey: 1 },
      { unique: true, partialFilterExpression: { activeKey: { $exists: true } } }
    ),

    tickets.createIndex({ eventId: 1, status: 1 }),
    tickets.createIndex({ eventId: 1, emailSentAt: 1 }), // drain cursor
    tickets.createIndex({ eventId: 1, holderName: 1 }),
    tickets.createIndex({ eventId: 1, email: 1 }),

    scanLog.createIndex({ eventId: 1, scannedAt: -1 }),
  ]);
}

let indexPromise: Promise<void> | undefined;

/**
 * Idempotent and memoised. A failure clears the memo so the next request
 * retries rather than caching the rejection forever.
 */
export async function ensureIndexes(): Promise<void> {
  if (!indexPromise) {
    indexPromise = createIndexes().catch((error) => {
      indexPromise = undefined;
      throw error;
    });
  }

  return indexPromise;
}

/** Test helper: drops the memo so a fresh database re-creates its indexes. */
export function resetIndexMemo(): void {
  indexPromise = undefined;
}
