import "server-only";

import { ObjectId } from "mongodb";

import { ensureHuntIndexes, huntCodesCollection, huntScansCollection } from "./db";
import { findHouse } from "./houses";
import type { RedeemResponseDto, RedeemStatusDto } from "./types";

export const COOLDOWN_MS = 30 * 60 * 1000;

export async function getCodeStatus(code: string): Promise<RedeemStatusDto> {
  await ensureHuntIndexes();

  const collection = await huntCodesCollection();
  const doc = await collection.findOne({ code });

  if (!doc) {
    return { status: "not_found", label: null, availableAt: null };
  }

  const now = new Date();
  const onCooldown = doc.cooldownUntil !== null && doc.cooldownUntil > now;

  return {
    status: onCooldown ? "cooldown" : "available",
    label: doc.label,
    availableAt: onCooldown ? doc.cooldownUntil!.toISOString() : null,
  };
}

/**
 * THE CORE RULE, same shape as ticket check-in: one conditional update, no
 * read-then-write. Of N concurrent scanners hitting the same code, exactly one
 * update matches "not currently on cooldown" and wins the capture.
 */
export async function redeemCode(
  code: string,
  houseId: string
): Promise<RedeemResponseDto> {
  await ensureHuntIndexes();

  const house = findHouse(houseId);

  if (!house) {
    return { result: "invalid_house", houseName: null, availableAt: null };
  }

  const codes = await huntCodesCollection();
  const now = new Date();
  const cooldownUntil = new Date(now.getTime() + COOLDOWN_MS);

  const captured = await codes.findOneAndUpdate(
    {
      code,
      $or: [{ cooldownUntil: null }, { cooldownUntil: { $lte: now } }],
    },
    {
      $set: {
        cooldownUntil,
        lastHouseId: house.id,
        lastHouseName: house.name,
        lastCapturedAt: now,
      },
      $inc: { captureCount: 1 },
    },
    { returnDocument: "after" }
  );

  if (!captured) {
    const existing = await codes.findOne({ code });

    if (!existing) {
      return { result: "not_found", houseName: null, availableAt: null };
    }

    return {
      result: "cooldown",
      houseName: null,
      availableAt: existing.cooldownUntil ? existing.cooldownUntil.toISOString() : null,
    };
  }

  const scans = await huntScansCollection();

  await scans.insertOne({
    _id: new ObjectId(),
    codeId: captured._id,
    code: captured.code,
    houseId: house.id,
    houseName: house.name,
    scannedAt: now,
  });

  return { result: "captured", houseName: house.name, availableAt: cooldownUntil.toISOString() };
}
