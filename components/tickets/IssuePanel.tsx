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

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Issue tickets</h1>
        <EventPicker events={events} eventId={eventId} onSelect={selectEvent} />
      </div>

      <section className="max-w-xl">
        <h2 className="text-lg font-semibold tracking-tight">One person</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Issues the ticket and emails it immediately.
        </p>

        <form onSubmit={handleIssue} className="mt-4 space-y-3">
          <input
            required
            value={holderName}
            onChange={(event) => setHolderName(event.target.value)}
            placeholder="Full name"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@nust.edu.pk"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />

          {issueError && <p className="text-sm text-red-600">{issueError}</p>}

          <button
            type="submit"
            disabled={submitting || !eventId}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Issuing…" : "Issue and email"}
          </button>
        </form>

        {issued && (
          <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
            <p className="text-sm font-medium">
              Ticket issued for {issued.holderName}
            </p>
            {issued.emailError ? (
              <p className="mt-1 text-sm text-red-600">
                Email failed: {issued.emailError}. The ticket exists — use Resend
                on the ticket list to try again.
              </p>
            ) : (
              <p className="mt-1 text-sm text-neutral-500">Emailed successfully.</p>
            )}
            <Image
              src={issued.qrDataUrl}
              alt="Ticket QR code"
              width={220}
              height={220}
              unoptimized
              className="mt-4 rounded-md bg-white"
            />
          </div>
        )}
      </section>

      <section className="max-w-3xl">
        <h2 className="text-lg font-semibold tracking-tight">Bulk upload</h2>
        <p className="mt-1 text-sm text-neutral-500">
          CSV with <code className="font-mono">name</code> and{" "}
          <code className="font-mono">email</code> columns. This creates the
          tickets only — send them from the queue below.
        </p>

        <form onSubmit={handleBulk} className="mt-4 space-y-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="block text-sm"
          />
          <textarea
            rows={5}
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
            placeholder={"name,email\nAli Khan,ali@nust.edu.pk"}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
          <button
            type="submit"
            disabled={uploading || !eventId || !csv.trim()}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Creating…" : "Create tickets"}
          </button>
        </form>

        {bulkOutcomes && (
          <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Line</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {bulkOutcomes.map((outcome, index) => (
                  <tr key={`${outcome.line}-${index}`}>
                    <td className="px-4 py-2 text-neutral-500">{outcome.line}</td>
                    <td className="px-4 py-2">{outcome.email || "—"}</td>
                    <td className="px-4 py-2">
                      {outcome.status === "queued" ? (
                        <span className="text-green-700">Queued</span>
                      ) : (
                        <span className="text-red-600">{outcome.reason}</span>
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
        <h2 className="text-lg font-semibold tracking-tight">Send queue</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {remaining} waiting. Sends {DRAIN_BATCH} every{" "}
          {DRAIN_INTERVAL_MS / 1000}s to stay under the mail provider&apos;s
          limit — keep this tab open while it runs. Stopping is safe: it resumes
          where it left off.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={startDrain}
            disabled={draining || remaining === 0}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {draining ? "Sending…" : "Start sending"}
          </button>
          {draining && (
            <button
              type="button"
              onClick={stopDrain}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              Stop
            </button>
          )}
        </div>

        {drainLog.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm">
            {drainLog.map((outcome, index) => (
              <li key={`${outcome.ticketId}-${index}`}>
                <span
                  className={
                    outcome.status === "sent" ? "text-green-700" : "text-red-600"
                  }
                >
                  {outcome.status === "sent" ? "Sent" : "Failed"}
                </span>{" "}
                <span className="text-neutral-600">{outcome.email}</span>
                {outcome.error && (
                  <span className="text-neutral-500"> — {outcome.error}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
