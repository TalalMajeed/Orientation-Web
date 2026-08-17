import "server-only";

import { NextResponse } from "next/server";

import { readJson } from "@/lib/request";
import {
  EmailValidationError,
  MAX_BODY,
  MAX_CELL,
  MAX_COLUMNS,
  MAX_RECIPIENTS,
  MAX_SHEET_BYTES,
  MAX_SUBJECT,
  type Recipient,
  type SheetInput,
  type SkippedRow,
} from "@/services/email/campaign";
import { EMAIL_PATTERN, normalizeColumnName } from "@/services/email/template";

const MAX_FILENAME = 200;
const MAX_SKIPPED = 500;

function record(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new EmailValidationError(`${field} must be an object`);
  }

  return value as Record<string, unknown>;
}

function cell(value: unknown): string {
  return (value == null ? "" : String(value)).trim().slice(0, MAX_CELL);
}

function parseColumns(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new EmailValidationError("columns must be a non-empty array");
  }

  if (value.length > MAX_COLUMNS) {
    throw new EmailValidationError(`A sheet cannot have more than ${MAX_COLUMNS} columns`);
  }

  const columns = value.map((entry, index) => {
    const name = normalizeColumnName(String(entry ?? ""));

    if (!name) {
      throw new EmailValidationError(`columns[${index}] is not a usable column name`);
    }

    return name;
  });

  if (new Set(columns).size !== columns.length) {
    throw new EmailValidationError("Column names must be unique after normalization");
  }

  return columns;
}

function parseRecipients(value: unknown, columns: string[]): Recipient[] {
  if (!Array.isArray(value)) {
    throw new EmailValidationError("recipients must be an array");
  }

  if (value.length === 0) {
    throw new EmailValidationError("The sheet has no rows with a valid email address");
  }

  if (value.length > MAX_RECIPIENTS) {
    throw new EmailValidationError(`A list cannot exceed ${MAX_RECIPIENTS} recipients`);
  }

  const allowed = new Set(columns);

  return value.map((entry, index) => {
    const raw = record(entry, `recipients[${index}]`);
    const email = cell(raw.email).toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
      throw new EmailValidationError(`recipients[${index}].email is not a valid address`);
    }

    const source = record(raw.values ?? {}, `recipients[${index}].values`);
    const values: Record<string, string> = {};

    for (const key of Object.keys(source)) {
      if (allowed.has(key)) {
        values[key] = cell(source[key]);
      }
    }

    return { email, values };
  });
}

function parseSkipped(value: unknown): SkippedRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, MAX_SKIPPED).map((entry, index) => {
    const raw = record(entry, `skipped[${index}]`);
    const row = Number(raw.row);

    return {
      row: Number.isFinite(row) ? row : 0,
      value: cell(raw.value),
      reason: cell(raw.reason) || "Skipped",
    };
  });
}

export function parseSheetInput(body: Record<string, unknown>): SheetInput {
  const columns = parseColumns(body.columns);
  const recipients = parseRecipients(body.recipients, columns);
  const skipped = parseSkipped(body.skipped);
  const fileName = cell(body.fileName).slice(0, MAX_FILENAME) || "list.xlsx";

  if (JSON.stringify(recipients).length > MAX_SHEET_BYTES) {
    throw new EmailValidationError("That sheet is too large — trim columns or split the list");
  }

  return { fileName, columns, recipients, skipped };
}

export function parseDraftInput(body: Record<string, unknown>): {
  subject: string;
  body: string;
} {
  const subject = typeof body.subject === "string" ? body.subject.replace(/\s+/g, " ").trim() : "";
  const content = typeof body.body === "string" ? body.body : "";

  if (subject.length > MAX_SUBJECT) {
    throw new EmailValidationError(`The subject must be ${MAX_SUBJECT} characters or fewer`);
  }

  if (content.length > MAX_BODY) {
    throw new EmailValidationError(`The body must be ${MAX_BODY} characters or fewer`);
  }

  return { subject, body: content };
}

export async function readEmailJsonBody(request: Request): Promise<Record<string, unknown>> {
  const parsed = await readJson(request);

  if (!parsed) {
    throw new EmailValidationError("Invalid JSON body");
  }

  return parsed;
}

export function emailValidationError(error: unknown) {
  if (error instanceof EmailValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  throw error;
}
