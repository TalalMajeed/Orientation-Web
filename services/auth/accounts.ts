import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

import { getMongoDb } from "@/lib/mongo";
import { isReservedUsername } from "@/services/auth/session";

const COLLECTION_NAME = "liaison_accounts";
const KEY_LENGTH = 64;

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_ACCOUNTS = 100;

export class AccountValidationError extends Error {}

export interface MemberAccount {
  username: string;
  createdAt: string;
  updatedAt: string;
}

interface MemberAccountDoc {
  _id: string;
  salt: string;
  hash: string;
  createdAt: Date;
  updatedAt: Date;
}

async function collection() {
  const db = await getMongoDb();

  return db.collection<MemberAccountDoc>(COLLECTION_NAME);
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, KEY_LENGTH).toString("hex");
}

export function normalizeUsername(value: unknown): string {
  if (typeof value !== "string") {
    throw new AccountValidationError("Username is required");
  }

  const username = value.trim().toLowerCase();

  if (!USERNAME_PATTERN.test(username)) {
    throw new AccountValidationError(
      "Username must be 3–32 characters: lowercase letters, digits, dot, dash or underscore"
    );
  }

  if (isReservedUsername(username)) {
    throw new AccountValidationError("That username is reserved");
  }

  return username;
}

export function validatePassword(value: unknown): string {
  if (typeof value !== "string") {
    throw new AccountValidationError("Password is required");
  }

  if (value.length < MIN_PASSWORD_LENGTH) {
    throw new AccountValidationError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    );
  }

  if (value.length > MAX_PASSWORD_LENGTH) {
    throw new AccountValidationError(
      `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer`
    );
  }

  return value;
}

function toAccount(doc: MemberAccountDoc): MemberAccount {
  return {
    username: doc._id,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listAccounts(): Promise<MemberAccount[]> {
  const docs = await collection();
  const found = await docs.find({}).sort({ _id: 1 }).toArray();

  return found.map(toAccount);
}

export async function createAccount(
  rawUsername: unknown,
  rawPassword: unknown
): Promise<MemberAccount> {
  const username = normalizeUsername(rawUsername);
  const password = validatePassword(rawPassword);
  const docs = await collection();

  if (await docs.findOne({ _id: username })) {
    throw new AccountValidationError(`An account named ${username} already exists`);
  }

  if ((await docs.countDocuments()) >= MAX_ACCOUNTS) {
    throw new AccountValidationError(`No more than ${MAX_ACCOUNTS} accounts are allowed`);
  }

  const salt = randomBytes(16).toString("hex");
  const now = new Date();
  const doc: MemberAccountDoc = {
    _id: username,
    salt,
    hash: hashPassword(password, salt),
    createdAt: now,
    updatedAt: now,
  };

  await docs.insertOne(doc);

  return toAccount(doc);
}

export async function setAccountPassword(
  rawUsername: unknown,
  rawPassword: unknown
): Promise<MemberAccount> {
  const username = normalizeUsername(rawUsername);
  const password = validatePassword(rawPassword);
  const docs = await collection();
  const salt = randomBytes(16).toString("hex");
  const updatedAt = new Date();

  const result = await docs.findOneAndUpdate(
    { _id: username },
    { $set: { salt, hash: hashPassword(password, salt), updatedAt } },
    { returnDocument: "after" }
  );

  if (!result) {
    throw new AccountValidationError(`No account named ${username}`);
  }

  return toAccount(result);
}

export async function deleteAccount(rawUsername: unknown): Promise<void> {
  const username = normalizeUsername(rawUsername);
  const docs = await collection();
  const result = await docs.deleteOne({ _id: username });

  if (result.deletedCount === 0) {
    throw new AccountValidationError(`No account named ${username}`);
  }
}

export async function verifyMemberCredentials(
  candidateUsername: string,
  candidatePassword: string
): Promise<string | null> {
  const username = candidateUsername.trim().toLowerCase();

  if (!USERNAME_PATTERN.test(username) || typeof candidatePassword !== "string") {
    return null;
  }

  const docs = await collection();
  const doc = await docs.findOne({ _id: username });

  if (!doc) {
    return null;
  }

  const expected = Buffer.from(doc.hash, "hex");
  const actual = Buffer.from(hashPassword(candidatePassword, doc.salt), "hex");

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  return doc._id;
}
