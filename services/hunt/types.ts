import type { ObjectId } from "mongodb";

export interface HuntCodeDoc {
  _id: ObjectId;
  code: string;
  label: string | null;
  createdAt: Date;
  captureCount: number;
  cooldownUntil: Date | null;
  lastHouseId: string | null;
  lastHouseName: string | null;
  lastCapturedAt: Date | null;
}

export interface HuntScanDoc {
  _id: ObjectId;
  codeId: ObjectId;
  code: string;
  houseId: string;
  houseName: string;
  scannedAt: Date;
}

export type CodeStatus = "available" | "cooldown";

export interface HuntCodeDto {
  id: string;
  code: string;
  label: string | null;
  url: string;
  qrDataUrl: string;
  status: CodeStatus;
  cooldownUntil: string | null;
  captureCount: number;
  lastHouseName: string | null;
  lastCapturedAt: string | null;
  createdAt: string;
}

export type RedeemResult = "captured" | "cooldown" | "not_found" | "invalid_house";

export interface RedeemStatusDto {
  status: "available" | "cooldown" | "not_found";
  label: string | null;
  availableAt: string | null;
}

export interface RedeemResponseDto {
  result: RedeemResult;
  houseName: string | null;
  availableAt: string | null;
}

export interface LeaderboardEntryDto {
  houseId: string;
  houseName: string;
  color: string;
  points: number;
}

export interface LeaderboardActivityDto {
  houseName: string;
  color: string;
  scannedAt: string;
}

export interface LeaderboardDto {
  board: LeaderboardEntryDto[];
  totalCaptures: number;
  recent: LeaderboardActivityDto[];
}
