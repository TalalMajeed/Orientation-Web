import * as XLSX from "xlsx";
import type { Gender, LogEntry, Student } from "@/components/liaison/types";

const DEMO_DEPARTMENTS = [
  "SEECS",
  "NBS",
  "SMME",
  "S3H",
  "SCME",
  "SNS",
  "ASAB",
  "IESE",
  "NICE",
  "SADA",
  "SINES",
];

const DEMO_FIRST_NAMES = [
  "Ali",
  "Ahmed",
  "Hassan",
  "Bilal",
  "Usman",
  "Hamza",
  "Fatima",
  "Ayesha",
  "Zainab",
  "Maryam",
  "Hira",
  "Sara",
  "Omar",
  "Saad",
  "Noor",
  "Iqra",
  "Zohaib",
  "Areeba",
  "Talha",
  "Mahnoor",
];

const DEMO_LAST_NAMES = [
  "Khan",
  "Malik",
  "Raza",
  "Butt",
  "Sheikh",
  "Farooq",
  "Qureshi",
  "Chaudhry",
  "Ahmed",
  "Javed",
  "Nawaz",
  "Aslam",
  "Abbasi",
  "Gondal",
  "Bhatti",
];

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`;

const text = (value: unknown) => (value == null ? "" : String(value).trim());

const randomOf = <T,>(values: T[]) => values[Math.floor(Math.random() * values.length)];

const normalizeKey = (key: string) => key.toLowerCase().replace(/[\s._-]/g, "");

function pick(row: Record<string, unknown>, keys: string[]): string {
  const normalized: Record<string, unknown> = {};

  for (const key of Object.keys(row)) {
    normalized[normalizeKey(key)] = row[key];
  }

  for (const key of keys) {
    const value = normalized[normalizeKey(key)];

    if (value != null && text(value) !== "") {
      return text(value);
    }
  }

  return "";
}

function normalizeGender(value: string): Gender | null {
  const normalized = value.toLowerCase();

  if (["m", "male", "boy", "man"].includes(normalized)) return "male";
  if (["f", "female", "girl", "woman"].includes(normalized)) return "female";

  return null;
}

export async function parseFile(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

export function processRows(rows: Record<string, unknown>[]): {
  students: Student[];
  log: LogEntry[];
} {
  const log: LogEntry[] = [];
  const seen = new Set<string>();
  const students: Student[] = [];

  rows.forEach((raw, index) => {
    const row = index + 2;
    const name = pick(raw, ["name", "studentname", "fullname"]);
    const cmsId = pick(raw, ["cmsid", "cms", "registrationid", "regno", "regid", "reg"]);
    const department = pick(raw, ["department", "program", "dept", "school", "degree"]);
    const gender = normalizeGender(pick(raw, ["gender", "sex"]));
    const rawMerit = pick(raw, ["merit", "meritnumber", "meritno", "cgpa", "aggregate"]);
    const merit = rawMerit && !isNaN(Number(rawMerit)) ? Number(rawMerit) : null;

    const missing: string[] = [];
    if (!name) missing.push("name");
    if (!cmsId) missing.push("CMS ID");
    if (!department) missing.push("department");
    if (!gender) missing.push("gender");

    if (missing.length) {
      log.push({
        type: "incomplete",
        row,
        message: `Missing ${missing.join(", ")}${name ? ` (${name})` : ""}`,
      });
      return;
    }

    const key = cmsId.toLowerCase();

    if (seen.has(key)) {
      log.push({ type: "duplicate", row, message: `Duplicate CMS ID ${cmsId} — ${name}` });
      return;
    }

    seen.add(key);
    students.push({
      id: uid(),
      name,
      cmsId,
      department,
      gender: gender as Gender,
      merit,
      houseId: null,
      ogId: null,
    });
  });

  return { students, log };
}

export function downloadRows(rows: Record<string, unknown>[], filename: string) {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  XLSX.writeFile(workbook, filename);
}

export function makeDemoStudents(count = 300): Student[] {
  const total = Math.max(0, Math.min(5000, Math.floor(count) || 0));

  return Array.from({ length: total }, (_, index) => ({
    id: uid(),
    name: `${randomOf(DEMO_FIRST_NAMES)} ${randomOf(DEMO_LAST_NAMES)}`,
    cmsId: String(450000 + index),
    department: randomOf(DEMO_DEPARTMENTS),
    gender: (Math.random() < 0.62 ? "male" : "female") as Gender,
    merit: Math.round((60 + Math.random() * 40) * 100) / 100,
    houseId: null,
    ogId: null,
  }));
}
