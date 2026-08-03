import "server-only";

import { randomInt } from "crypto";
import { ObjectId } from "mongodb";
import QRCode from "qrcode";

import { ensureHuntIndexes, huntCodesCollection } from "./db";
import type { CodeStatus, HuntCodeDoc, HuntCodeDto } from "./types";

export class HuntCodeNotFoundError extends Error {}

// LOCAL TESTING ONLY — QR codes need to resolve on whatever this dev server
// is actually reachable at. Swap back to the real domain below before pushing:
//   export const HUNT_BASE_URL = "https://orientation.nust.edu.pk";
export const HUNT_BASE_URL = "http://localhost:3002";

// Excludes 0/O/1/I/L — these get printed small next to a physical QR, and a
// human occasionally has to read one out over the phone.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const MAX_GENERATION_ATTEMPTS = 10;
const MAX_BULK_COUNT = 500;

function generateCode(): string {
  let code = "";

  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }

  return code;
}

async function generateUniqueCode(): Promise<string> {
  const collection = await huntCodesCollection();

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const candidate = generateCode();
    const existing = await collection.findOne({ code: candidate });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Failed to generate a unique hunt code");
}

export function toHuntUrl(code: string): string {
  return `${HUNT_BASE_URL}/hunt/c/${code}`;
}

const QR_OPTIONS = {
  width: 600,
  margin: 2,
  errorCorrectionLevel: "M",
  color: { dark: "#000000", light: "#ffffff" },
} as const;

async function renderQrDataUrl(code: string): Promise<string> {
  return QRCode.toDataURL(toHuntUrl(code), QR_OPTIONS);
}

function statusOf(doc: HuntCodeDoc, now: Date): CodeStatus {
  return doc.cooldownUntil && doc.cooldownUntil > now ? "cooldown" : "available";
}

async function toDto(doc: HuntCodeDoc): Promise<HuntCodeDto> {
  const now = new Date();

  return {
    id: doc._id.toHexString(),
    code: doc.code,
    label: doc.label,
    url: toHuntUrl(doc.code),
    qrDataUrl: await renderQrDataUrl(doc.code),
    status: statusOf(doc, now),
    cooldownUntil: doc.cooldownUntil ? doc.cooldownUntil.toISOString() : null,
    captureCount: doc.captureCount,
    lastHouseName: doc.lastHouseName,
    lastCapturedAt: doc.lastCapturedAt ? doc.lastCapturedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function listCodes(): Promise<HuntCodeDto[]> {
  await ensureHuntIndexes();

  const collection = await huntCodesCollection();
  const docs = await collection.find().sort({ createdAt: -1 }).toArray();

  return Promise.all(docs.map(toDto));
}

export interface CreateCodesInput {
  count: number;
  labelPrefix?: string | null;
}

/**
 * Bulk-generates N codes in one call — this is the "make 150-200 QR codes"
 * button. Labels are just a human-readable hint for the admin table /
 * physical placement notes; the code itself is the only thing that matters.
 */
export async function createCodes({
  count,
  labelPrefix,
}: CreateCodesInput): Promise<HuntCodeDto[]> {
  await ensureHuntIndexes();

  const clampedCount = Math.max(1, Math.min(MAX_BULK_COUNT, Math.floor(count)));
  const collection = await huntCodesCollection();
  const now = new Date();
  const docs: HuntCodeDoc[] = [];

  for (let i = 0; i < clampedCount; i++) {
    const code = await generateUniqueCode();

    docs.push({
      _id: new ObjectId(),
      code,
      label: labelPrefix ? `${labelPrefix} ${i + 1}` : null,
      createdAt: now,
      captureCount: 0,
      cooldownUntil: null,
      lastHouseId: null,
      lastHouseName: null,
      lastCapturedAt: null,
    });
  }

  await collection.insertMany(docs);

  return Promise.all(docs.map(toDto));
}

export async function deleteCode(id: string): Promise<void> {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new HuntCodeNotFoundError("Invalid code id");
  }

  const collection = await huntCodesCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    throw new HuntCodeNotFoundError("No such code");
  }
}

/** Bulk delete for the admin panel's multi-select. Silently ignores any id
 * that isn't a valid ObjectId or no longer exists — the caller just wants
 * "these gone", not a per-id failure report. */
export async function deleteCodes(ids: string[]): Promise<number> {
  const objectIds = ids
    .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))
    .map((id) => new ObjectId(id));

  if (objectIds.length === 0) {
    return 0;
  }

  const collection = await huntCodesCollection();
  const result = await collection.deleteMany({ _id: { $in: objectIds } });

  return result.deletedCount;
}
