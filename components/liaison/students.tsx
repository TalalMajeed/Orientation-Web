"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiaison } from "@/components/liaison/store";
import { exportRows, houseName, ogLabel } from "@/components/liaison/labels";
import { downloadRows, makeDemoStudents, parseFile, processRows } from "@/components/liaison/sheet";

const PAGE_SIZE = 100;
const COLUMNS = ["Name", "CMS ID", "Department", "Gender", "Merit", "House", "Group"];

const PILL =
  "rounded-full border-2 border-dotted px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors";
const PILL_ON = "border-transparent bg-fg text-surface";
const PILL_OFF = "border-fg/40 text-fg hover:border-fg";

export default function StudentsView() {
  const { students, houses, log, setUpload, clearAll, canWrite } = useLiaison();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [demoCount, setDemoCount] = useState(300);
  const [gender, setGender] = useState<"all" | "male" | "female">("all");
  const [department, setDepartment] = useState("all");
  const [query, setQuery] = useState("");
  const [showLog, setShowLog] = useState(false);
  const [page, setPage] = useState(1);

  const departments = useMemo(
    () => Array.from(new Set(students.map((student) => student.department))).sort(),
    [students]
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return students.filter(
      (student) =>
        (gender === "all" || student.gender === gender) &&
        (department === "all" || student.department === department) &&
        (!search ||
          student.name.toLowerCase().includes(search) ||
          student.cmsId.toLowerCase().includes(search))
    );
  }, [students, gender, department, query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [gender, department, query, students]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  const readFile = async (file: File) => {
    setBusy(true);

    try {
      const rows = await parseFile(file);
      const parsed = processRows(rows);
      await setUpload(parsed.students, parsed.log);
    } catch {
      await setUpload([], [
        {
          type: "info",
          row: null,
          message: "Could not read that file. Use .csv, .xlsx or .xls.",
        },
      ]);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const resetEverything = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }

    setConfirmReset(false);
    setGender("all");
    setDepartment("all");
    setQuery("");
    setShowLog(false);
    await clearAll();
  };

  const duplicates = log.filter((entry) => entry.type === "duplicate").length;
  const incomplete = log.filter((entry) => entry.type === "incomplete").length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-serif text-5xl font-bold text-fg">Students</h2>
        <div className="flex flex-wrap gap-2">
          {canWrite && (
            <>
              <button
                onClick={resetEverything}
                onBlur={() => setConfirmReset(false)}
                title="Wipes students, allocation and house edits, then re-seeds the default houses"
                className={`${PILL} ${
                  confirmReset
                    ? "border-transparent bg-danger text-cream"
                    : "border-danger/50 text-danger hover:border-danger"
                }`}
              >
                {confirmReset ? "Confirm reset?" : "Reset all"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(event) => event.target.files?.[0] && readFile(event.target.files[0])}
              />
              <button onClick={() => fileRef.current?.click()} className={`${PILL} ${PILL_ON}`}>
                {busy ? "Reading…" : "Upload merit list"}
              </button>
              <span className="flex items-center gap-1.5 rounded-full border-2 border-dotted border-fg/40 py-0.5 pl-4 pr-1">
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={demoCount}
                  onChange={(event) =>
                    setDemoCount(Math.max(1, Math.min(5000, Number(event.target.value) || 0)))
                  }
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
            </>
          )}
          <button
            onClick={() =>
              downloadRows(
                [
                  {
                    Name: "Ali Khan",
                    "CMS ID": "450001",
                    Department: "SEECS",
                    Gender: "Male",
                    Merit: 82.5,
                  },
                ],
                "orientation-template.csv"
              )
            }
            className={`${PILL} ${PILL_OFF}`}
          >
            Sample template
          </button>
        </div>
      </div>

      {(students.length > 0 || log.length > 0) && (
        <div className="mt-6 rounded-2xl border border-dashed border-fg/25 p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-[0.1em]">
            <span className="text-fg">{students.length} valid</span>
            <span className="text-danger">{duplicates} duplicates removed</span>
            <span className="text-fg/70">{incomplete} incomplete flagged</span>
            {log.length > 0 && (
              <button
                onClick={() => setShowLog((shown) => !shown)}
                className="text-sky underline decoration-dotted"
              >
                {showLog ? "hide log" : "view log"}
              </button>
            )}
          </div>
          {showLog && (
            <div className="mt-3 max-h-52 overflow-auto border-t border-fg/10 pt-3">
              {log.length === 0 ? (
                <p className="font-mono text-[11px] text-fg/40">No issues.</p>
              ) : (
                log.map((entry, index) => (
                  <p key={index} className="font-mono text-[11px] text-fg/60">
                    {entry.row ? `Row ${entry.row}` : "—"} · [{entry.type}] {entry.message}
                  </p>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(["all", "male", "female"] as const).map((option) => (
          <button
            key={option}
            onClick={() => setGender(option)}
            className={`${PILL} ${gender === option ? PILL_ON : PILL_OFF}`}
          >
            {option}
          </button>
        ))}
        <div className="relative inline-block">
          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className="cursor-pointer appearance-none rounded-full border-2 border-dotted border-fg/40 bg-surface py-1.5 pl-4 pr-9 font-mono text-[11px] uppercase tracking-[0.1em] text-fg transition-colors hover:border-fg focus:border-fg focus:outline-none"
          >
            <option value="all">All departments</option>
            {departments.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <svg
            aria-hidden
            viewBox="0 0 12 12"
            className="pointer-events-none absolute right-3.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-fg/50"
          >
            <path
              d="M2 4l4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name / CMS…"
          className="rounded-full border-2 border-dotted border-fg/40 bg-transparent px-4 py-1.5 font-mono text-[11px] text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none"
        />
        {filtered.length > 0 && (
          <button
            onClick={() => downloadRows(exportRows(houses, filtered), "students-filtered.csv")}
            className={`${PILL} ${PILL_OFF}`}
          >
            Export ({filtered.length})
          </button>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-fg/12">
        <table className="w-full min-w-[720px] border-collapse font-mono text-[12px]">
          <thead>
            <tr className="border-b border-fg/15 text-left text-fg/45">
              {COLUMNS.map((column) => (
                <th key={column} className="px-4 py-3 text-[10px] uppercase tracking-[0.12em]">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((student) => (
              <tr key={student.id} className="border-b border-fg/8 text-fg/80">
                <td className="px-4 py-2.5 text-fg">{student.name}</td>
                <td className="px-4 py-2.5">{student.cmsId}</td>
                <td className="px-4 py-2.5">{student.department}</td>
                <td className="px-4 py-2.5">
                  <span className={student.gender === "male" ? "text-sky" : "text-ember"}>
                    {student.gender}
                  </span>
                </td>
                <td className="px-4 py-2.5">{student.merit ?? "—"}</td>
                <td className="px-4 py-2.5">{houseName(houses, student.houseId)}</td>
                <td className="px-4 py-2.5">{ogLabel(houses, student)}</td>
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
