"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiaison } from "./store";
import { downloadRows, makeDemoStudents, parseFile, processRows } from "./logic";
import type { Student } from "./types";

const PAGE_SIZE = 100;

export default function StudentsView() {
  const { students, houses, log, setUpload } = useLiaison();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [demoCount, setDemoCount] = useState(300);
  const [gender, setGender] = useState<"all" | "male" | "female">("all");
  const [dept, setDept] = useState("all");
  const [q, setQ] = useState("");
  const [showLog, setShowLog] = useState(false);
  const [page, setPage] = useState(1);

  const houseName = (id: string | null) => houses.find((h) => h.id === id)?.name ?? "—";
  const ogLabel = (s: Student) => {
    const h = houses.find((x) => x.id === s.houseId);
    const og = h?.ogs.find((o) => o.id === s.ogId);
    return og ? `${h!.name} ${og.group}` : "—";
  };

  const departments = useMemo(
    () => Array.from(new Set(students.map((s) => s.department))).sort(),
    [students]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return students.filter(
      (s) =>
        (gender === "all" || s.gender === gender) &&
        (dept === "all" || s.department === dept) &&
        (!query || s.name.toLowerCase().includes(query) || s.cmsId.toLowerCase().includes(query))
    );
  }, [students, gender, dept, q]);

  // A different filtered set means the old page number may not exist anymore.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset to first page when the result set changes
    setPage(1);
  }, [gender, dept, q, students]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  const onFile = async (file: File) => {
    setBusy(true);
    try {
      const rows = await parseFile(file);
      const { students: parsed, log } = processRows(rows);
      setUpload(parsed, log);
    } catch {
      setUpload([], [{ type: "info", row: null, message: "Could not read that file. Use .csv, .xlsx or .xls." }]);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const dupes = log.filter((l) => l.type === "duplicate").length;
  const incomplete = log.filter((l) => l.type === "incomplete").length;

  const pill = "rounded-full border-2 border-dotted px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors";
  const on = "border-transparent bg-fg text-surface";
  const off = "border-fg/40 text-fg hover:border-fg";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-serif text-5xl font-bold text-fg">Students</h2>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          <button onClick={() => fileRef.current?.click()} className={`${pill} ${on}`}>
            {busy ? "Reading…" : "Upload merit list"}
          </button>
          <span className="flex items-center gap-1.5 rounded-full border-2 border-dotted border-fg/40 py-0.5 pl-4 pr-1">
            <input
              type="number"
              min={1}
              max={5000}
              value={demoCount}
              onChange={(e) => setDemoCount(Math.max(1, Math.min(5000, Number(e.target.value) || 0)))}
              className="no-spinner w-14 bg-transparent font-mono text-[11px] text-fg focus:outline-none"
              aria-label="Number of demo students"
            />
            <button
              onClick={() =>
                setUpload(makeDemoStudents(demoCount), [
                  { type: "info", row: null, message: `Loaded ${demoCount} demo students.` },
                ])
              }
              className="rounded-full bg-fg px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-surface transition-colors hover:bg-ember hover:text-cream"
            >
              Load demo
            </button>
          </span>
          <button
            onClick={() =>
              downloadRows(
                [{ Name: "Ali Khan", "CMS ID": "450001", Department: "SEECS", Gender: "Male", Merit: 82.5 }],
                "orientation-template.csv"
              )
            }
            className={`${pill} ${off}`}
          >
            Sample template
          </button>
        </div>
      </div>

      {/* Validation / dedup report */}
      {(students.length > 0 || log.length > 0) && (
        <div className="mt-6 rounded-2xl border border-dashed border-fg/25 p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-[0.1em]">
            <span className="text-fg">{students.length} valid</span>
            <span className="text-ember">{dupes} duplicates removed</span>
            <span className="text-fg/70">{incomplete} incomplete flagged</span>
            {log.length > 0 && (
              <button onClick={() => setShowLog((v) => !v)} className="text-sky underline decoration-dotted">
                {showLog ? "hide log" : "view log"}
              </button>
            )}
          </div>
          {showLog && (
            <div className="mt-3 max-h-52 overflow-auto border-t border-fg/10 pt-3">
              {log.length === 0 ? (
                <p className="font-mono text-[11px] text-fg/40">No issues.</p>
              ) : (
                log.map((l, i) => (
                  <p key={i} className="font-mono text-[11px] text-fg/60">
                    {l.row ? `Row ${l.row}` : "—"} · [{l.type}] {l.message}
                  </p>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(["all", "male", "female"] as const).map((g) => (
          <button key={g} onClick={() => setGender(g)} className={`${pill} ${gender === g ? on : off}`}>
            {g}
          </button>
        ))}
        <div className="relative inline-block">
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="cursor-pointer appearance-none rounded-full border-2 border-dotted border-fg/40 bg-surface py-1.5 pl-4 pr-9 font-mono text-[11px] uppercase tracking-[0.1em] text-fg transition-colors hover:border-fg focus:border-fg focus:outline-none"
          >
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <svg
            aria-hidden
            viewBox="0 0 12 12"
            className="pointer-events-none absolute right-3.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-fg/50"
          >
            <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name / CMS…"
          className="rounded-full border-2 border-dotted border-fg/40 bg-transparent px-4 py-1.5 font-mono text-[11px] text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none"
        />
        {filtered.length > 0 && (
          <button
            onClick={() =>
              downloadRows(
                filtered.map((s) => ({ Name: s.name, "CMS ID": s.cmsId, Department: s.department, Gender: s.gender, Merit: s.merit, House: houseName(s.houseId), Group: ogLabel(s) })),
                "students-filtered.csv"
              )
            }
            className={`${pill} ${off}`}
          >
            Export ({filtered.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-fg/12">
        <table className="w-full min-w-[720px] border-collapse font-mono text-[12px]">
          <thead>
            <tr className="border-b border-fg/15 text-left text-fg/45">
              {["Name", "CMS ID", "Department", "Gender", "Merit", "House", "Group"].map((h) => (
                <th key={h} className="px-4 py-3 text-[10px] uppercase tracking-[0.12em]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((s) => (
              <tr key={s.id} className="border-b border-fg/8 text-fg/80">
                <td className="px-4 py-2.5 text-fg">{s.name}</td>
                <td className="px-4 py-2.5">{s.cmsId}</td>
                <td className="px-4 py-2.5">{s.department}</td>
                <td className="px-4 py-2.5">
                  <span className={s.gender === "male" ? "text-sky" : "text-ember"}>{s.gender}</span>
                </td>
                <td className="px-4 py-2.5">{s.merit ?? "—"}</td>
                <td className="px-4 py-2.5">{houseName(s.houseId)}</td>
                <td className="px-4 py-2.5">{ogLabel(s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-fg/40">
            {students.length === 0 ? "No students loaded." : "No matches."}
          </p>
        )}
      </div>

      {/* Pagination — page through the whole set, however large */}
      {filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.1em] text-fg/50">
          <span>
            {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}
            {filtered.length !== students.length ? ` (of ${students.length})` : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className="rounded-full border-2 border-dotted border-fg/40 px-4 py-1.5 text-fg transition-colors hover:border-fg disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-fg/40">
              Page {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="rounded-full border-2 border-dotted border-fg/40 px-4 py-1.5 text-fg transition-colors hover:border-fg disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
