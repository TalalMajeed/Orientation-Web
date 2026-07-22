/**
 * Small RFC 4180 reader/writer. A dependency would be more code than this, and
 * the roster CSV comes from a spreadsheet export, not from the open web.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let fieldStarted = false;

  // Strip a BOM: Excel adds one and it otherwise corrupts the first header.
  const input = text.replace(/^﻿/, "");

  function endField() {
    row.push(field);
    field = "";
    fieldStarted = false;
  }

  function endRow() {
    endField();

    if (row.length > 1 || row[0] !== "") {
      rows.push(row);
    }

    row = [];
  }

  for (let index = 0; index < input.length; index++) {
    const char = input[index];

    if (inQuotes) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }

      continue;
    }

    if (char === '"' && !fieldStarted) {
      inQuotes = true;
      fieldStarted = true;
    } else if (char === ",") {
      endField();
    } else if (char === "\n") {
      endRow();
    } else if (char === "\r") {
      // Handled by the \n that follows it.
    } else {
      field += char;
      fieldStarted = true;
    }
  }

  if (field !== "" || row.length > 0) {
    endRow();
  }

  return rows;
}

export interface RosterRow {
  line: number;
  name: string;
  email: string;
}

export interface RosterProblem {
  line: number;
  message: string;
}

export interface ParsedRoster {
  rows: RosterRow[];
  problems: RosterProblem[];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Expects a header row containing `name` and `email` columns, in any order. */
export function parseRosterCsv(text: string): ParsedRoster {
  const table = parseCsv(text);
  const rows: RosterRow[] = [];
  const problems: RosterProblem[] = [];

  if (table.length === 0) {
    return { rows, problems: [{ line: 0, message: "The file is empty" }] };
  }

  const header = table[0].map((cell) => cell.trim().toLowerCase());
  const nameIndex = header.indexOf("name");
  const emailIndex = header.indexOf("email");

  if (nameIndex === -1 || emailIndex === -1) {
    return {
      rows,
      problems: [
        { line: 1, message: "Header row must contain 'name' and 'email'" },
      ],
    };
  }

  const seen = new Set<string>();

  for (let index = 1; index < table.length; index++) {
    const line = index + 1;
    const cells = table[index];
    const name = (cells[nameIndex] ?? "").trim();
    const email = (cells[emailIndex] ?? "").trim().toLowerCase();

    if (!name && !email) {
      continue;
    }

    if (!name) {
      problems.push({ line, message: "Missing name" });
      continue;
    }

    if (!EMAIL_PATTERN.test(email)) {
      problems.push({ line, message: `Invalid email: ${email || "(blank)"}` });
      continue;
    }

    // Catch duplicates inside the file itself, before they hit the index and
    // come back as a confusing per-row database error.
    if (seen.has(email)) {
      problems.push({ line, message: `Duplicate of an earlier row: ${email}` });
      continue;
    }

    seen.add(email);
    rows.push({ line, name, email });
  }

  return { rows, problems };
}

function escapeCsvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(header: string[], rows: string[][]): string {
  return [header, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell ?? "")).join(","))
    .join("\r\n");
}
