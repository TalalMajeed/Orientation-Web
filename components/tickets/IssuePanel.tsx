"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import EventPicker from "./EventPicker";
import { useEvents } from "./useEvents";

interface BulkOutcome {
  line: number;
  name?: string;
  email: string;
  status: "queued" | "failed";
  reason?: string;
}

interface DrainOutcome {
  ticketId: string;
  email: string;
  status: "sent" | "failed";
  error?: string;
}

// Graph throttles at roughly 30 messages a minute per mailbox. Ten per batch
// with a 20 second gap sits just under that.
const DRAIN_BATCH = 10;
const DRAIN_INTERVAL_MS = 20_000;

export default function IssuePanel() {
  const { events, eventId, selectEvent } = useEvents();

  const [holderName, setHolderName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{
    holderName: string;
    qrDataUrl: string;
    emailError: string | null;
  } | null>(null);

  const [csv, setCsv] = useState("");
  const [uploading, setUploading] = useState(false);
  const [bulkOutcomes, setBulkOutcomes] = useState<BulkOutcome[] | null>(null);

  const [remaining, setRemaining] = useState(0);
  const [draining, setDraining] = useState(false);
  const [drainLog, setDrainLog] = useState<DrainOutcome[]>([]);
  const drainingRef = useRef(false);

  const refreshRemaining = useCallback(async () => {
    if (!eventId) {
      return;
    }

    const response = await fetch(`/api/v1/event-tickets/drain?eventId=${eventId}`);

    if (response.ok) {
      const data = await response.json();
      setRemaining(data.remaining ?? 0);
    }
  }, [eventId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- queue depth follows the selected event
    refreshRemaining();
  }, [refreshRemaining]);

  useEffect(() => {
    return () => {
      drainingRef.current = false;
    };
  }, []);

  async function handleIssue(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();

    if (!eventId) {
      setIssueError("Pick an event first");
      return;
    }

    setSubmitting(true);
    setIssueError(null);
    setIssued(null);

    try {
      const response = await fetch("/api/v1/event-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, holderName, email }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setIssueError(
          typeof data.error === "string" ? data.error : "Could not issue ticket"
        );
        return;
      }

      setIssued({
        holderName,
        qrDataUrl: data.qrDataUrl,
        emailError: data.emailError ?? null,
      });
      setHolderName("");
      setEmail("");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBulk(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();

    if (!eventId) {
      return;
    }

    setUploading(true);
    setBulkOutcomes(null);

    try {
      const response = await fetch("/api/v1/event-tickets/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, csv }),
      });

      const data = await response.json().catch(() => ({}));

      setBulkOutcomes(
        data.outcomes ?? [
          { line: 0, email: "", status: "failed", reason: data.error },
        ]
      );
      await refreshRemaining();
    } finally {
      setUploading(false);
    }
  }

  async function handleFile(input: React.ChangeEvent<HTMLInputElement>) {
    const file = input.target.files?.[0];

    if (file) {
      setCsv(await file.text());
    }
  }

  /**
   * Paced client-side loop rather than one long request: 2000 emails is over an
   * hour of wall clock, which no serverless request survives. Progress is
   * resumable — emailSentAt is the cursor, so closing the tab loses nothing but
   * the remaining sends.
   */
  async function startDrain() {
    if (!eventId || drainingRef.current) {
      return;
    }

    drainingRef.current = true;
    setDraining(true);
    setDrainLog([]);

    try {
      for (;;) {
        if (!drainingRef.current) {
          break;
        }

        const response = await fetch("/api/v1/event-tickets/drain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, limit: DRAIN_BATCH }),
        });

        if (!response.ok) {
          break;
        }

        const data = await response.json();

        setDrainLog((previous) => [...(data.outcomes ?? []), ...previous].slice(0, 50));
        setRemaining(data.remaining ?? 0);

        if (!data.remaining || data.attempted === 0) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, DRAIN_INTERVAL_MS));
      }
    } finally {
      drainingRef.current = false;
      setDraining(false);
    }
  }

  function stopDrain() {
    drainingRef.current = false;
  }

  const field =
    "w-full rounded-full border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 font-mono text-[13px] text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none";
  const primaryBtn =
    "rounded-full border-2 border-transparent bg-fg px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-surface transition-colors hover:bg-ember hover:text-cream disabled:cursor-not-allowed disabled:opacity-40";
  const ghostBtn =
    "rounded-full border-2 border-dotted border-fg/40 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-fg transition-colors hover:border-fg";
  const label =
    "mt-2 font-mono text-[12px] leading-relaxed uppercase tracking-[0.06em] text-fg/50";

  return (
    <div className="space-y-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-5xl font-bold text-fg">Issue tickets</h1>
        <EventPicker events={events} eventId={eventId} onSelect={selectEvent} />
      </div>

      <section className="max-w-xl">
        <h2 className="font-serif text-3xl font-bold text-fg">One person</h2>
        <p className={label}>Issues the ticket and emails it immediately.</p>

        <form onSubmit={handleIssue} className="mt-6 space-y-3">
          <input
            required
            value={holderName}
            onChange={(event) => setHolderName(event.target.value)}
            placeholder="Full name"
            className={field}
          />
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@nust.edu.pk"
            className={field}
          />

          {issueError && (
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ember">
              {issueError}
            </p>
          )}

          <button type="submit" disabled={submitting || !eventId} className={primaryBtn}>
            {submitting ? "Issuing…" : "Issue and email"}
          </button>
        </form>

        {issued && (
          <div className="mt-6 rounded-2xl border border-fg/12 bg-fg/[0.02] p-6">
            <p className="font-serif text-xl font-bold text-fg">
              Ticket issued for {issued.holderName}
            </p>
            {issued.emailError ? (
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-ember">
                Email failed: {issued.emailError}. The ticket exists — use Resend
                on the ticket list to try again.
              </p>
            ) : (
              <p className="mt-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-fg/50">
                <span className="h-2 w-2 rounded-full bg-sky" />
                Emailed successfully.
              </p>
            )}
            <Image
              src={issued.qrDataUrl}
              alt="Ticket QR code"
              width={220}
              height={220}
              unoptimized
              className="mt-5 rounded-xl bg-white p-2"
            />
          </div>
        )}
      </section>

      <section className="max-w-3xl">
        <h2 className="font-serif text-3xl font-bold text-fg">Bulk upload</h2>
        <p className={label}>
          CSV with <code className="text-fg/70">name</code> and{" "}
          <code className="text-fg/70">email</code> columns. This creates the
          tickets only — send them from the queue below.
        </p>

        <form onSubmit={handleBulk} className="mt-6 space-y-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="block w-full font-mono text-[12px] text-fg/70 file:mr-4 file:rounded-full file:border-2 file:border-dotted file:border-fg/40 file:bg-transparent file:px-4 file:py-2 file:font-mono file:text-[11px] file:uppercase file:tracking-[0.1em] file:text-fg hover:file:border-fg"
          />
          <textarea
            rows={5}
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
            placeholder={"name,email\nAli Khan,ali@nust.edu.pk"}
            className="w-full rounded-2xl border-2 border-dotted border-fg/25 bg-transparent px-4 py-3 font-mono text-[12px] text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none"
          />
          <button
            type="submit"
            disabled={uploading || !eventId || !csv.trim()}
            className={primaryBtn}
          >
            {uploading ? "Creating…" : "Create tickets"}
          </button>
        </form>

        {bulkOutcomes && (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-fg/12">
            <table className="w-full min-w-[480px] border-collapse text-left font-mono text-[12px]">
              <thead>
                <tr className="border-b border-fg/15 text-fg/45">
                  <th className="px-4 py-3 text-[10px] uppercase tracking-[0.12em]">Line</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-[0.12em]">Email</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-[0.12em]">Result</th>
                </tr>
              </thead>
              <tbody>
                {bulkOutcomes.map((outcome, index) => (
                  <tr key={`${outcome.line}-${index}`} className="border-b border-fg/8">
                    <td className="px-4 py-2.5 text-fg/45">{outcome.line}</td>
                    <td className="px-4 py-2.5 text-fg/80">{outcome.email || "—"}</td>
                    <td className="px-4 py-2.5">
                      {outcome.status === "queued" ? (
                        <span className="text-sky">Queued</span>
                      ) : (
                        <span className="text-ember">{outcome.reason}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="max-w-3xl">
        <h2 className="font-serif text-3xl font-bold text-fg">Send queue</h2>
        <p className={label}>
          {remaining} waiting. Sends {DRAIN_BATCH} every{" "}
          {DRAIN_INTERVAL_MS / 1000}s to stay under the mail provider&apos;s
          limit — keep this tab open while it runs. Stopping is safe: it resumes
          where it left off.
        </p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={startDrain}
            disabled={draining || remaining === 0}
            className={primaryBtn}
          >
            {draining ? "Sending…" : "Start sending"}
          </button>
          {draining && (
            <button type="button" onClick={stopDrain} className={ghostBtn}>
              Stop
            </button>
          )}
        </div>

        {drainLog.length > 0 && (
          <ul className="mt-5 space-y-1.5 font-mono text-[12px]">
            {drainLog.map((outcome, index) => (
              <li key={`${outcome.ticketId}-${index}`}>
                <span
                  className={
                    outcome.status === "sent" ? "text-sky" : "text-ember"
                  }
                >
                  {outcome.status === "sent" ? "Sent" : "Failed"}
                </span>{" "}
                <span className="text-fg/70">{outcome.email}</span>
                {outcome.error && (
                  <span className="text-fg/40"> — {outcome.error}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
