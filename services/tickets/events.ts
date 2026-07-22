import "server-only";

import { ObjectId } from "mongodb";

import { ensureIndexes, eventsCollection } from "./db";
import type { EventDoc, EventDto } from "./types";

/**
 * ObjectId.isValid also accepts arbitrary 12-character strings, which turns
 * user input into a silently different id. Require the hex form.
 */
export function toObjectId(value: string): ObjectId | null {
  return /^[0-9a-fA-F]{24}$/.test(value) ? new ObjectId(value) : null;
}

export function toEventDto(doc: EventDoc): EventDto {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    startsAt: doc.startsAt ? doc.startsAt.toISOString() : null,
    venue: doc.venue,
  };
}

export async function listEvents(): Promise<EventDto[]> {
  await ensureIndexes();

  const events = await eventsCollection();
  const docs = await events.find().sort({ createdAt: -1 }).toArray();

  return docs.map(toEventDto);
}

export async function getEvent(id: ObjectId): Promise<EventDoc | null> {
  const events = await eventsCollection();

  return events.findOne({ _id: id });
}

export interface CreateEventInput {
  name: string;
  startsAt?: Date | null;
  venue?: string | null;
}

export async function createEvent({
  name,
  startsAt = null,
  venue = null,
}: CreateEventInput): Promise<EventDto> {
  await ensureIndexes();

  const events = await eventsCollection();
  const doc: EventDoc = {
    _id: new ObjectId(),
    name: name.trim(),
    startsAt,
    venue: venue ? venue.trim() : null,
    createdAt: new Date(),
  };

  await events.insertOne(doc);

  return toEventDto(doc);
}
