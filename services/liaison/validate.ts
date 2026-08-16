import "server-only";

import { LiaisonValidationError } from "./db";
import type { Gender, LogEntry, Student } from "./types";

const GENDERS: Gender[] = ["male", "female"];
const LOG_TYPES: LogEntry["type"][] = [
  "duplicate",
  "incomplete",
  "overflow",
  "info",
];

const MAX_TEXT_LENGTH = 200;
const MAX_LOG_ENTRIES = 5000;

/**
 * Everything below crosses the network from a browser, so nothing on it is
 * trusted: each field is re-typed and length-capped here rather than spread
 * into a document as-is. Unknown keys are dropped by construction — the
 * objects are rebuilt field by field, never copied.
 */
function text(value: unknown, field: string, { allowEmpty = false } = {}): string {
  if (typeof value !== "string") {
    throw new LiaisonValidationError(`${field} must be a string`);
  }

  const trimmed = value.trim();

  if (!allowEmpty && trimmed.length === 0) {
    throw new LiaisonValidationError(`${field} is required`);
  }

  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw new LiaisonValidationError(
      `${field} must be ${MAX_TEXT_LENGTH} characters or fewer`
    );
  }

  return trimmed;
}

function nullableId(value: unknown, field: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return text(value, field);
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new LiaisonValidationError(`${field} must be an object`);
  }

  return value as Record<string, unknown>;
}

export function parseStudent(value: unknown, index: number): Student {
  const raw = record(value, `students[${index}]`);
  const gender = raw.gender;

  if (typeof gender !== "string" || !(GENDERS as string[]).includes(gender)) {
    throw new LiaisonValidationError(
      `students[${index}].gender must be "male" or "female"`
    );
  }

  const merit =
    raw.merit === null || raw.merit === undefined ? null : Number(raw.merit);

  if (merit !== null && !Number.isFinite(merit)) {
    throw new LiaisonValidationError(
      `students[${index}].merit must be a number or null`
    );
  }

  return {
    id: text(raw.id, `students[${index}].id`),
    name: text(raw.name, `students[${index}].name`),
    cmsId: text(raw.cmsId, `students[${index}].cmsId`),
    department: text(raw.department, `students[${index}].department`),
    gender: gender as Gender,
    merit,
    houseId: nullableId(raw.houseId, `students[${index}].houseId`),
    ogId: nullableId(raw.ogId, `students[${index}].ogId`),
  };
}

export function parseStudents(value: unknown): Student[] {
  if (!Array.isArray(value)) {
    throw new LiaisonValidationError("students must be an array");
  }

  return value.map(parseStudent);
}

export function parseLog(value: unknown): LogEntry[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new LiaisonValidationError("log must be an array");
  }

  // The log is advisory — a long one is a sign of a messy upload, not an
  // attack, so it is truncated rather than rejected.
  return value.slice(0, MAX_LOG_ENTRIES).map((entry, index) => {
    const raw = record(entry, `log[${index}]`);
    const type = raw.type;

    if (typeof type !== "string" || !(LOG_TYPES as string[]).includes(type)) {
      throw new LiaisonValidationError(`log[${index}].type is not a known type`);
    }

    const row = raw.row === null || raw.row === undefined ? null : Number(raw.row);

    if (row !== null && !Number.isFinite(row)) {
      throw new LiaisonValidationError(`log[${index}].row must be a number or null`);
    }

    return {
      type: type as LogEntry["type"],
      row,
      message: text(raw.message, `log[${index}].message`, { allowEmpty: true }),
    };
  });
}

export function parseHouseCapacity(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const capacity = Number(value);

  if (!Number.isFinite(capacity) || capacity < 1) {
    throw new LiaisonValidationError(
      "houseCapacity must be a positive number or null"
    );
  }

  return Math.floor(capacity);
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new LiaisonValidationError("Invalid JSON body");
  }

  return record(body, "body");
}

export { text as parseText };
