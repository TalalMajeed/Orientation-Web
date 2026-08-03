"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface HuntCodeDto {
  id: string;
  code: string;
  label: string | null;
  url: string;
  qrDataUrl: string;
  status: "available" | "cooldown";
  cooldownUntil: string | null;
  captureCount: number;
  lastHouseName: string | null;
  lastCapturedAt: string | null;
  createdAt: string;
}

const PAGE_SIZE = 50;

function formatTime(iso: string | null): string {
  if (!iso) return "—";

  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function HuntManager() {
  const router = useRouter();
  const [codes, setCodes] = useState<HuntCodeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [count, setCount] = useState(150);
  const [labelPrefix, setLabelPrefix] = useState("Spot");
  const [generating, setGenerating] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<HuntCodeDto | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    const response = await fetch("/api/v1/hunt/codes");

    if (response.status === 401) {
      router.push("/login?next=/hunt");
      return;
    }

    if (response.ok) {
      const data = await response.json();
      setCodes(data.codes ?? []);
    } else {
      setError("Could not load codes");
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    load();
  }, [load]);

  // Cooldowns expire client-side too — re-render every 30s so "Available in
  // 12m" counts down without needing a refetch.
  useEffect(() => {
    const interval = setInterval(() => setCodes((prev) => [...prev]), 30_000);
    return () => clearInterval(interval);
  }, []);

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault();
    setGenerating(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/v1/hunt/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, labelPrefix: labelPrefix || undefined }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not generate codes");
        return;
      }

      setNotice(`Generated ${data.codes.length} codes.`);
      setCodes((prev) => [...data.codes, ...prev]);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(code: HuntCodeDto) {
    setBusyId(code.id);
    setNotice(null);

    const response = await fetch(`/api/v1/hunt/codes/${code.id}`, { method: "DELETE" });

    setBusyId(null);

    if (!response.ok) {
      setError("Could not delete code");
      return;
    }

    setCodes((prev) => prev.filter((c) => c.id !== code.id));
    setSelected((prev) => {
      if (!prev.has(code.id)) return prev;
      const next = new Set(prev);
      next.delete(code.id);
      return next;
    });
    if (qrPreview?.id === code.id) setQrPreview(null);
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePageSelected() {
    const pageIds = pageRows.map((c) => c.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(codes.map((c) => c.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;

    const confirmed = window.confirm(
      `Delete ${selected.size} code${selected.size === 1 ? "" : "s"}? This can't be undone.`
    );

    if (!confirmed) return;

    setBulkDeleting(true);
    setError(null);
    setNotice(null);

    const ids = Array.from(selected);

    try {
      const response = await fetch("/api/v1/hunt/codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not delete codes");
        return;
      }

      const removed = new Set(ids);
      setCodes((prev) => prev.filter((c) => !removed.has(c.id)));
      setSelected(new Set());
      setNotice(`Deleted ${data.deletedCount} code${data.deletedCount === 1 ? "" : "s"}.`);
      if (qrPreview && removed.has(qrPreview.id)) setQrPreview(null);
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/v1/auth/login", { method: "DELETE" });
    router.push("/login?next=/hunt");
    router.refresh();
  }

  const stats = useMemo(() => {
    const available = codes.filter((c) => c.status === "available").length;
    const cooldown = codes.length - available;
    const captures = codes.reduce((sum, c) => sum + c.captureCount, 0);

    return { total: codes.length, available, cooldown, captures };
  }, [codes]);

  const totalPages = Math.max(1, Math.ceil(codes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = codes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const pill =
    "rounded-full border-2 border-dotted px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors";
  const ghost = "border-fg/40 text-fg hover:border-fg";
  const field =
    "rounded-full border-2 border-dotted border-fg/25 bg-transparent px-5 py-2.5 font-mono text-[13px] text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-italic text-sm italic text-fg/50">— NUST Orientation &apos;26</p>
          <h1 className="mt-2 font-serif text-5xl font-bold text-fg">Scavenger Hunt</h1>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50">
            Generate QR codes, track captures, run the leaderboard
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/hunt/print"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border-2 border-transparent bg-fg px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-surface transition-colors hover:bg-ember hover:text-cream"
          >
            Print all →
          </a>
          <a href="/scavenger-hunt" target="_blank" rel="noreferrer" className={`${pill} ${ghost}`}>
            View leaderboard →
          </a>
          <button onClick={handleLogout} className={`${pill} ${ghost}`}>
            Log out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total codes", value: stats.total },
          { label: "Available", value: stats.available },
          { label: "On cooldown", value: stats.cooldown },
          { label: "Total captures", value: stats.captures },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-fg/12 bg-fg/[0.02] p-5">
            <div className="text-4xl font-bold tabular-nums text-fg">{s.value}</div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-fg/50">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Generate */}
      <form
        onSubmit={handleGenerate}
        className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-fg/25 p-5"
      >
        <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-fg/60">
          Count
          <input
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(500, Number(e.target.value) || 0)))}
            className="no-spinner w-20 rounded-md border border-fg/25 bg-transparent px-2 py-1 text-fg focus:border-fg focus:outline-none"
          />
        </label>
        <input
          value={labelPrefix}
          onChange={(e) => setLabelPrefix(e.target.value)}
          placeholder="Label prefix (optional)"
          className={field}
        />
        <button
          type="submit"
          disabled={generating}
          className="rounded-full border-2 border-transparent bg-fg px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-surface transition-colors hover:bg-ember hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
        >
          {generating ? "Generating…" : `Generate ${count} codes`}
        </button>
      </form>

      {notice && (
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-sky">{notice}</p>
      )}
      {error && (
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-ember">{error}</p>
      )}

      {/* Bulk action bar — appears once anything is selected */}
      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-ember/50 bg-ember/[0.06] p-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-fg">
            {selected.size} selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="rounded-full border-2 border-transparent bg-ember px-5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-cream transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bulkDeleting ? "Deleting…" : "Delete selected"}
          </button>
          {selected.size < codes.length && (
            <button
              onClick={selectAll}
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-fg/60 underline decoration-dotted underline-offset-4 hover:text-fg"
            >
              Select all {codes.length}
            </button>
          )}
          <button
            onClick={clearSelection}
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-fg/60 underline decoration-dotted underline-offset-4 hover:text-fg"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Codes table */}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-fg/12">
        <table className="w-full min-w-[900px] border-collapse text-left font-mono text-[12px]">
          <thead>
            <tr className="border-b border-fg/15 text-fg/45">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={pageRows.length > 0 && pageRows.every((c) => selected.has(c.id))}
                  onChange={togglePageSelected}
                  aria-label="Select all on this page"
                  className="h-3.5 w-3.5 accent-fg"
                />
              </th>
              {["Code", "Label", "Status", "Captures", "Last house", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-[10px] uppercase tracking-[0.12em]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-4 py-4 text-fg/45" colSpan={7}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && codes.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center uppercase tracking-[0.1em] text-fg/40" colSpan={7}>
                  No codes yet — generate a batch above.
                </td>
              </tr>
            )}
            {pageRows.map((c) => {
              const cooldownActive =
                c.status === "cooldown" && c.cooldownUntil && new Date(c.cooldownUntil) > new Date();
              const minsLeft = cooldownActive
                ? Math.max(1, Math.ceil((new Date(c.cooldownUntil!).getTime() - Date.now()) / 60_000))
                : 0;

              return (
                <tr
                  key={c.id}
                  className={`border-b border-fg/8 text-fg/80 transition-colors hover:bg-fg/[0.03] ${
                    selected.has(c.id) ? "bg-fg/[0.03]" : ""
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleSelected(c.id)}
                      aria-label={`Select ${c.code}`}
                      className="h-3.5 w-3.5 accent-fg"
                    />
                  </td>
                  <td className="px-4 py-2.5 font-sans font-medium text-fg">{c.code}</td>
                  <td className="px-4 py-2.5 text-fg/60">{c.label ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    {cooldownActive ? (
                      <span className="text-ember">Cooldown · {minsLeft}m</span>
                    ) : (
                      <span className="text-sky">Available</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">{c.captureCount}</td>
                  <td className="px-4 py-2.5 text-fg/60">
                    {c.lastHouseName ? `${c.lastHouseName} · ${formatTime(c.lastCapturedAt)}` : "—"}
                  </td>
                  <td className="space-x-3 whitespace-nowrap px-4 py-2.5">
                    <button
                      onClick={() => setQrPreview(c)}
                      className="uppercase tracking-[0.08em] text-fg underline decoration-dotted underline-offset-4 hover:text-sky"
                    >
                      QR
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      disabled={busyId === c.id}
                      className="uppercase tracking-[0.08em] text-ember underline decoration-dotted underline-offset-4 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {codes.length > 0 && (
        <div className="mt-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.1em] text-fg/50">
          <span>
            {codes.length} code{codes.length === 1 ? "" : "s"} · page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className="rounded-full border-2 border-dotted border-fg/40 px-4 py-1.5 text-fg transition-colors hover:border-fg disabled:opacity-30"
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="rounded-full border-2 border-dotted border-fg/40 px-4 py-1.5 text-fg transition-colors hover:border-fg disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* QR preview modal */}
      {qrPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-6 backdrop-blur-sm"
          onClick={() => setQrPreview(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-fg/15 bg-surface p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg/50">
              {qrPreview.label ?? qrPreview.code}
            </p>
            <h3 className="mt-1 font-serif text-2xl font-bold text-fg">{qrPreview.code}</h3>
            <Image
              src={qrPreview.qrDataUrl}
              alt={`QR for ${qrPreview.code}`}
              width={280}
              height={280}
              unoptimized
              className="mx-auto mt-4 rounded-lg bg-white p-2"
            />
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <a
                href={qrPreview.qrDataUrl}
                download={`hunt-${qrPreview.code}.png`}
                className="rounded-full border-2 border-transparent bg-fg px-5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-surface transition-colors hover:bg-ember hover:text-cream"
              >
                Download PNG
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(qrPreview.url)}
                className="rounded-full border-2 border-dotted border-fg/40 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-fg transition-colors hover:border-fg"
              >
                Copy link
              </button>
            </div>
            <button
              onClick={() => setQrPreview(null)}
              className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-fg/40 hover:text-fg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
