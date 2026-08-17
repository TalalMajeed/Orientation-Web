import * as XLSX from "xlsx";

import { EMAIL_PATTERN, normalizeColumnNames } from "@/services/email/template";

export interface MailRecipient {
  email: string;
  values: Record<string, string>;
}

export interface MailSkippedRow {
  row: number;
  value: string;
  reason: string;
}

export interface MailList {
  fileName: string;
  columns: string[];
  recipients: MailRecipient[];
  skipped: MailSkippedRow[];
}

export class MailSheetError extends Error {}

export type CampaignStatus = "draft" | "running" | "cancelled" | "completed" | "failed";

export interface CampaignFailure {
  email: string;
  error: string;
}

export interface CampaignProgress {
  subject: string;
  body: string;
  status: CampaignStatus;
  total: number;
  cursor: number;
  sent: number;
  failed: number;
  failures: CampaignFailure[];
  error: string | null;
  startedAt: number | null;
  finishedAt: number | null;
}

export interface Campaign extends CampaignProgress {
  fileName: string;
  columns: string[];
  recipients: MailRecipient[];
  skipped: MailSkippedRow[];
}

const cell = (value: unknown) => (value == null ? "" : String(value)).trim();

function findEmailColumn(headers: unknown[], rows: unknown[][]): string | null {
  for (let position = 1; position < headers.length; position += 1) {
    const filled = rows
      .map((row) => cell(row?.[position]).toLowerCase())
      .filter((value) => value !== "");

    if (filled.length > 0 && filled.every((value) => EMAIL_PATTERN.test(value))) {
      return cell(headers[position]) || `column ${position + 1}`;
    }
  }

  return null;
}

export async function readMailList(file: File): Promise<MailList> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    throw new MailSheetError("That file has no sheets.");
  }

  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });

  const [headers, ...rows] = grid;

  if (!headers || headers.length === 0) {
    throw new MailSheetError("That sheet has no header row.");
  }

  const columns = normalizeColumnNames(headers);
  const recipients: MailRecipient[] = [];
  const skipped: MailSkippedRow[] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const line = index + 2;
    const cells = columns.map((_column, position) => cell(row?.[position]));

    if (cells.every((value) => value === "")) {
      return;
    }

    const email = cells[0].toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
      skipped.push({
        row: line,
        value: cells[0],
        reason: email ? "Not a valid email address" : "No email address",
      });
      return;
    }

    if (seen.has(email)) {
      skipped.push({ row: line, value: email, reason: "Duplicate address" });
      return;
    }

    seen.add(email);

    const values: Record<string, string> = {};

    columns.forEach((column, position) => {
      values[column] = position === 0 ? email : cells[position];
    });

    recipients.push({ email, values });
  });

  if (recipients.length === 0) {
    const suggestion = findEmailColumn(headers, rows);

    throw new MailSheetError(
      suggestion
        ? `Column A must hold the email addresses — "${suggestion}" looks like the address column. Move it to the first column and re-upload.`
        : "No valid email addresses in the first column."
    );
  }

  return { fileName: file.name, columns, recipients, skipped };
}
