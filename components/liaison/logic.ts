import * as XLSX from "xlsx";
import type { Config, Gender, House, LogEntry, Student } from "./types";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`;

const str = (v: unknown) => (v == null ? "" : String(v).trim());

function pick(row: Record<string, unknown>, keys: string[]): string {
  const lower: Record<string, unknown> = {};
  for (const k of Object.keys(row)) lower[k.toLowerCase().replace(/[\s._-]/g, "")] = row[k];
  for (const k of keys) {
    const norm = k.toLowerCase().replace(/[\s._-]/g, "");
    if (lower[norm] != null && str(lower[norm]) !== "") return str(lower[norm]);
  }
  return "";
}

function normGender(v: string): Gender | null {
  const s = v.toLowerCase();
  if (["m", "male", "boy", "man"].includes(s)) return "male";
  if (["f", "female", "girl", "woman"].includes(s)) return "female";
  return null;
}

// SheetJS reads cell values only (no macros/scripts are executed), so parsing an
// uploaded workbook can't run embedded code.
export async function parseFile(file: File): Promise<Record<string, unknown>[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

// Validate required columns, drop duplicates (by CMS ID), flag incomplete rows.
export function processRows(rows: Record<string, unknown>[]): {
  students: Student[];
  log: LogEntry[];
} {
  const log: LogEntry[] = [];
  const seen = new Set<string>();
  const students: Student[] = [];

  rows.forEach((raw, i) => {
    const row = i + 2; // +1 for 0-index, +1 for header
    const name = pick(raw, ["name", "studentname", "fullname"]);
    const cmsId = pick(raw, ["cmsid", "cms", "registrationid", "regno", "regid", "reg"]);
    const department = pick(raw, ["department", "program", "dept", "school", "degree"]);
    const gender = normGender(pick(raw, ["gender", "sex"]));
    const meritRaw = pick(raw, ["merit", "meritnumber", "meritno", "cgpa", "aggregate"]);
    const merit = meritRaw && !isNaN(Number(meritRaw)) ? Number(meritRaw) : null;

    const missing: string[] = [];
    if (!name) missing.push("name");
    if (!cmsId) missing.push("CMS ID");
    if (!department) missing.push("department");
    if (!gender) missing.push("gender");

    if (missing.length) {
      log.push({ type: "incomplete", row, message: `Missing ${missing.join(", ")}${name ? ` (${name})` : ""}` });
      return;
    }
    const key = cmsId.toLowerCase();
    if (seen.has(key)) {
      log.push({ type: "duplicate", row, message: `Duplicate CMS ID ${cmsId} — ${name}` });
      return;
    }
    seen.add(key);
    students.push({ id: uid(), name, cmsId, department, gender: gender!, merit, houseId: null, ogId: null });
  });

  return { students, log };
}

// Gender-balanced allocation: snake-distribute each gender across houses (keeps
// house sizes + gender ratios even), then round-robin each gender into the
// house's OG groups. Respects an optional per-house capacity.
export function allocate(
  students: Student[],
  houses: House[],
  config: Config
): { students: Student[]; log: LogEntry[] } {
  const log: LogEntry[] = [];
  const houseIds = houses.map((h) => h.id);
  const cap = config.houseCapacity;
  const counts: Record<string, number> = Object.fromEntries(houseIds.map((id) => [id, 0]));
  const pool = students.map((s) => ({ ...s, houseId: null as string | null, ogId: null as string | null }));

  // Sort each gender by school (department) first, then merit. Snake-distributing
  // this order spreads every school evenly across the houses too — so no house
  // ends up all-SEECS or all-NBS, and gender stays balanced on top of it.
  const byDeptThenMerit = (a: Student, b: Student) =>
    a.department.localeCompare(b.department) || (b.merit ?? 0) - (a.merit ?? 0);
  const males = pool.filter((s) => s.gender === "male").sort(byDeptThenMerit);
  const females = pool.filter((s) => s.gender === "female").sort(byDeptThenMerit);

  const snake = (list: Student[]) => {
    let idx = 0;
    let dir = 1;
    for (const s of list) {
      let tries = 0;
      while (cap != null && counts[houseIds[idx]] >= cap && tries <= houseIds.length) {
        idx = (idx + 1) % houseIds.length;
        tries++;
      }
      if (cap != null && counts[houseIds[idx]] >= cap) {
        log.push({ type: "overflow", row: null, message: `No capacity left for ${s.name} (${s.cmsId})` });
        continue;
      }
      s.houseId = houseIds[idx];
      counts[houseIds[idx]]++;
      idx += dir;
      if (idx >= houseIds.length) {
        idx = houseIds.length - 1;
        dir = -1;
      } else if (idx < 0) {
        idx = 0;
        dir = 1;
      }
    }
  };
  snake(males);
  snake(females);

  for (const house of houses) {
    if (!house.ogs.length) continue;
    const members = pool.filter((s) => s.houseId === house.id);
    (["male", "female"] as Gender[]).forEach((g) => {
      members
        .filter((s) => s.gender === g)
        .sort(byDeptThenMerit)
        .forEach((s, i) => {
          s.ogId = house.ogs[i % house.ogs.length].id;
        });
    });
  }

  return { students: pool, log };
}

export function downloadRows(rows: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename);
}

// --- Demo data ---------------------------------------------------------------

const DEMO_DEPTS = ["SEECS", "NBS", "SMME", "S3H", "SCME", "SNS", "ASAB", "IESE", "NICE", "SADA", "SINES"];
const DEMO_FIRST = ["Ali", "Ahmed", "Hassan", "Bilal", "Usman", "Hamza", "Fatima", "Ayesha", "Zainab", "Maryam", "Hira", "Sara", "Omar", "Saad", "Noor", "Iqra", "Zohaib", "Areeba", "Talha", "Mahnoor"];
const DEMO_LAST = ["Khan", "Malik", "Raza", "Butt", "Sheikh", "Farooq", "Qureshi", "Chaudhry", "Ahmed", "Javed", "Nawaz", "Aslam", "Abbasi", "Gondal", "Bhatti"];
const randOf = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

// Generates a plausible merit list for demos/testing. ~62% male mirrors a
// typical NUST intake so the gender-balanced allocation has something to balance.
export function makeDemoStudents(n = 300): Student[] {
  const count = Math.max(0, Math.min(5000, Math.floor(n) || 0));
  return Array.from({ length: count }, (_, i) => ({
    id: uid(),
    name: `${randOf(DEMO_FIRST)} ${randOf(DEMO_LAST)}`,
    cmsId: String(450000 + i),
    department: randOf(DEMO_DEPTS),
    gender: (Math.random() < 0.62 ? "male" : "female") as Gender,
    merit: Math.round((60 + Math.random() * 40) * 100) / 100,
    houseId: null,
    ogId: null,
  }));
}
