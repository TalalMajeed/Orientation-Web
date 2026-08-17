"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  MailSheetError,
  readMailList,
  type Campaign,
  type CampaignProgress,
} from "@/components/liaison/mailer";
import { renderBodyText, renderSubject, unknownPlaceholders } from "@/services/email/template";

const API = "/api/v1/liaison/email";
const PAGE_SIZE = 50;
const POLL_MS = 2000;
const AUTOSAVE_MS = 800;
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_MB = 3;

const formatSize = (bytes: number) =>
  bytes >= 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1000))} KB`;

const PILL =
  "rounded-full border-2 border-dotted px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors disabled:opacity-30";
const PILL_ON = "border-transparent bg-fg text-surface";
const PILL_OFF = "border-fg/40 text-fg hover:border-fg";
const FIELD =
  "w-full rounded-2xl border-2 border-dotted border-fg/30 bg-transparent px-4 py-3 font-mono text-[13px] text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none disabled:opacity-50";

const EMPTY: Campaign = {
  fileName: "",
  columns: [],
  recipients: [],
  skipped: [],
  subject: "",
  body: "",
  attachments: [],
  status: "draft",
  total: 0,
  cursor: 0,
  sent: 0,
  failed: 0,
  failures: [],
  error: null,
  startedAt: null,
  finishedAt: null,
};

const STATUS_LABEL: Record<Campaign["status"], string> = {
  draft: "Draft",
  running: "Dispatching",
  cancelled: "Cancelled",
  completed: "Completed",
  failed: "Failed",
};

export default function EmailsView() {
  const fileRef = useRef<HTMLInputElement>(null);
  const attachmentRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [campaign, setCampaign] = useState<Campaign>(EMPTY);
  const [sender, setSender] = useState("info@orientation.nust.edu.pk");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSkipped, setShowSkipped] = useState(false);
  const [showFailures, setShowFailures] = useState(false);
  const [page, setPage] = useState(1);

  const running = campaign.status === "running";

  const applyCampaign = useCallback((next: Campaign) => {
    setCampaign(next);
    setSubject(next.subject);
    setBody(next.body);
  }, []);

  useEffect(() => {
    let active = true;

    fetch(API)
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data) => {
        if (!active) return;
        if (data.campaign) applyCampaign(data.campaign as Campaign);
        if (typeof data.sender === "string") setSender(data.sender);
      })
      .catch(() => active && setError("Could not load the email workspace"))
      .finally(() => active && setLoaded(true));

    return () => {
      active = false;
    };
  }, [applyCampaign]);

  useEffect(() => {
    if (!running) {
      return;
    }

    let active = true;
    const poll = async () => {
      const response = await fetch(`${API}/progress`).catch(() => null);

      if (!response?.ok || !active) {
        return;
      }

      const data = await response.json().catch(() => null);

      if (active && data?.progress) {
        setCampaign((current) => ({ ...current, ...(data.progress as CampaignProgress) }));
      }
    };

    const timer = setInterval(poll, POLL_MS);
    void poll();

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [running]);

  useEffect(() => {
    if (!loaded || running) {
      return;
    }

    if (subject === campaign.subject && body === campaign.body) {
      return;
    }

    const timer = setTimeout(() => {
      void fetch(API, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (data?.progress) {
            setCampaign((current) => ({ ...current, ...(data.progress as CampaignProgress) }));
          }
        })
        .catch(() => {});
    }, AUTOSAVE_MS);

    return () => clearTimeout(timer);
  }, [subject, body, loaded, running, campaign.subject, campaign.body]);

  const call = async (path: string, init: RequestInit): Promise<Record<string, unknown> | null> => {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(path, {
        ...init,
        headers: typeof init.body === "string" ? { "Content-Type": "application/json" } : undefined,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "Request failed");
        return null;
      }

      return data as Record<string, unknown>;
    } catch {
      setError("Could not reach the server");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);

    try {
      const list = await readMailList(file);
      const data = await call(API, { method: "PUT", body: JSON.stringify(list) });

      if (data?.campaign) {
        applyCampaign({ ...(data.campaign as Campaign), subject, body });
        setPage(1);
      }
    } catch (readError) {
      setError(
        readError instanceof MailSheetError
          ? readError.message
          : "Could not read that file. Use .xlsx, .xls or .csv."
      );
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const dispatch = async () => {
    const data = await call(`${API}/dispatch`, { method: "POST" });

    if (data?.progress) {
      setCampaign((current) => ({ ...current, ...(data.progress as CampaignProgress) }));
    }
  };

  const cancel = async () => {
    const data = await call(`${API}/dispatch`, { method: "DELETE" });

    if (data?.progress) {
      setCampaign((current) => ({ ...current, ...(data.progress as CampaignProgress) }));
    }
  };

  const clear = async () => {
    const data = await call(API, { method: "DELETE" });

    if (data?.campaign) {
      applyCampaign(data.campaign as Campaign);
      setPage(1);
    }
  };

  const attach = async (file: File) => {
    const form = new FormData();

    form.append("file", file);

    const data = await call(`${API}/attachments`, { method: "POST", body: form });

    if (data?.campaign) {
      applyCampaign({ ...(data.campaign as Campaign), subject, body });
    }

    if (attachmentRef.current) {
      attachmentRef.current.value = "";
    }
  };

  const detach = async (id: string) => {
    const data = await call(`${API}/attachments`, {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });

    if (data?.campaign) {
      applyCampaign({ ...(data.campaign as Campaign), subject, body });
    }
  };

  const insertVariable = (name: string) => {
    const field = bodyRef.current;
    const token = `{${name}}`;

    if (!field) {
      setBody((current) => current + token);
      return;
    }

    const start = field.selectionStart ?? body.length;
    const end = field.selectionEnd ?? body.length;

    setBody(`${body.slice(0, start)}${token}${body.slice(end)}`);
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const unknown = useMemo(
    () => unknownPlaceholders(`${subject}\n${body}`, campaign.columns),
    [subject, body, campaign.columns]
  );

  const sample = campaign.recipients[0];
  const totalPages = Math.max(1, Math.ceil(campaign.recipients.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = campaign.recipients.slice(start, start + PAGE_SIZE);

  const processed = Math.min(campaign.cursor, campaign.total);
  const percent = campaign.total ? Math.round((processed / campaign.total) * 100) : 0;
  const resumable =
    (campaign.status === "cancelled" || campaign.status === "failed") &&
    campaign.cursor > 0 &&
    campaign.cursor < campaign.total;
  const exhausted = campaign.total > 0 && campaign.cursor >= campaign.total;
  const canDispatch =
    !running && campaign.total > 0 && !exhausted && subject.trim() !== "" && body.trim() !== "";

  if (!loaded) {
    return (
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg/50">
        Loading emails…
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-5xl font-bold text-fg">Emails</h2>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50">
            Sent from <span className="text-ember">{sender}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={running || busy}
            className={`${PILL} ${PILL_ON}`}
          >
            {busy ? "Working…" : campaign.total ? "Replace list" : "Upload list"}
          </button>
          {(campaign.total > 0 || campaign.skipped.length > 0) && (
            <button
              onClick={clear}
              disabled={running || busy}
              className={`${PILL} ${PILL_OFF}`}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-2xl border border-danger/40 bg-danger/5 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-danger"
        >
          {error}
        </p>
      )}

      {campaign.total === 0 ? (
        <p className="mt-8 font-mono text-[12px] uppercase tracking-[0.1em] text-fg/50">
          Upload an .xlsx / .csv list to begin. The first column must hold the email addresses;
          every other column becomes a <span className="text-ember">{"{variable}"}</span> you can
          drop into the message.
        </p>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-fg/25 p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-[0.1em]">
            <span className="text-fg/70">{campaign.fileName}</span>
            <span className="text-fg">{campaign.total} recipients</span>
            {campaign.skipped.length > 0 && (
              <button
                onClick={() => setShowSkipped((shown) => !shown)}
                className="text-danger underline decoration-dotted"
              >
                {campaign.skipped.length} rows skipped
              </button>
            )}
          </div>
          {showSkipped && campaign.skipped.length > 0 && (
            <div className="mt-3 max-h-52 overflow-auto border-t border-fg/10 pt-3">
              {campaign.skipped.map((row, index) => (
                <p key={index} className="font-mono text-[11px] text-fg/60">
                  Row {row.row} · {row.reason}
                  {row.value ? ` — ${row.value}` : ""}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-4">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg/50">
            Subject
          </span>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            disabled={running}
            maxLength={300}
            placeholder="Welcome to NUST Orientation '26, {name}"
            className={`mt-2 ${FIELD}`}
          />
        </label>

        {campaign.columns.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg/50">
              Variables
            </span>
            {campaign.columns.map((column) => (
              <button
                key={column}
                type="button"
                onClick={() => insertVariable(column)}
                disabled={running}
                className="rounded-full border border-fg/25 px-3 py-1 font-mono text-[11px] text-fg/70 transition-colors hover:border-fg hover:text-fg disabled:opacity-30"
              >
                {`{${column}}`}
              </button>
            ))}
          </div>
        )}

        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg/50">
            Message
          </span>
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={running}
            rows={12}
            maxLength={20000}
            placeholder={"Hi {name},\n\nYour orientation house is {og_house}. See you on campus."}
            className={`mt-2 ${FIELD} resize-none leading-relaxed`}
          />
        </label>

        {unknown.length > 0 && (
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-danger">
            No column for {unknown.map((name) => `{${name}}`).join(", ")} — these render empty.
          </p>
        )}

        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg/50">
            Attachments — optional
          </span>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              ref={attachmentRef}
              type="file"
              className="hidden"
              onChange={(event) => event.target.files?.[0] && attach(event.target.files[0])}
            />
            <button
              type="button"
              onClick={() => attachmentRef.current?.click()}
              disabled={running || busy || campaign.attachments.length >= MAX_ATTACHMENTS}
              className={`${PILL} ${PILL_OFF}`}
            >
              Add file
            </button>
            {campaign.attachments.map((attachment) => (
              <span
                key={attachment.id}
                className="flex items-center gap-2 rounded-full border border-fg/25 py-0.5 pl-3 pr-0.5 font-mono text-[11px] text-fg/70"
              >
                {attachment.name}
                <span className="text-fg/40">{formatSize(attachment.size)}</span>
                <button
                  type="button"
                  onClick={() => detach(attachment.id)}
                  disabled={running || busy}
                  aria-label={`Remove ${attachment.name}`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[14px] leading-none text-fg/50 transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-30"
                >
                  ×
                </button>
              </span>
            ))}
            {campaign.attachments.length === 0 && (
              <span className="font-mono text-[11px] text-fg/40">
                Sent with every email · up to {MAX_ATTACHMENTS} files, {MAX_ATTACHMENT_MB} MB total
              </span>
            )}
          </div>
        </div>

        {sample && (subject || body) && (
          <div>
            <button
              type="button"
              onClick={() => setShowPreview((shown) => !shown)}
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-fg/70 underline decoration-dotted transition-colors hover:text-fg"
            >
              {showPreview ? "Hide preview" : `Preview for ${sample.email}`}
            </button>
            {showPreview && (
              <div className="mt-3 rounded-2xl border border-fg/12 p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg/45">
                  Subject
                </p>
                <p className="mt-1 font-mono text-[13px] text-fg">
                  {renderSubject(subject, sample.values) || "—"}
                </p>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-fg/45">
                  Body
                </p>
                <p className="mt-1 whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-fg/80">
                  {renderBodyText(body, sample.values) || "—"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-fg/12 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em]">
            <span className={running ? "text-ember" : "text-fg/70"}>
              {STATUS_LABEL[campaign.status]}
            </span>
            <span className="text-fg">
              {processed} / {campaign.total}
            </span>
            <span className="text-fg/60">{campaign.sent} sent</span>
            {campaign.failed > 0 && (
              <button
                onClick={() => setShowFailures((shown) => !shown)}
                className="text-danger underline decoration-dotted"
              >
                {campaign.failed} failed
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {running ? (
              <button onClick={cancel} disabled={busy} className={`${PILL} ${PILL_OFF}`}>
                Cancel dispatch
              </button>
            ) : (
              <button
                onClick={dispatch}
                disabled={!canDispatch || busy}
                className={`${PILL} ${PILL_ON}`}
              >
                {resumable ? "Resume dispatch" : "Dispatch"}
              </button>
            )}
          </div>
        </div>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Email dispatch progress"
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-fg/10"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${
              campaign.status === "failed" ? "bg-danger" : "bg-fg"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-fg/45">
          {percent}%
          {exhausted && campaign.status !== "running"
            ? " · list finished — clear it to send again"
            : ""}
        </p>

        {campaign.error && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-danger">
            {campaign.error}
          </p>
        )}

        {showFailures && campaign.failures.length > 0 && (
          <div className="mt-4 max-h-52 overflow-auto border-t border-fg/10 pt-3">
            {campaign.failures.map((failure, index) => (
              <p key={index} className="font-mono text-[11px] text-fg/60">
                {failure.email} — {failure.error}
              </p>
            ))}
          </div>
        )}
      </div>

      {campaign.recipients.length > 0 && (
        <>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-fg/12">
            <table className="w-full min-w-[720px] border-collapse font-mono text-[12px]">
              <thead>
                <tr className="border-b border-fg/15 text-left text-fg/45">
                  <th className="px-4 py-3 text-[10px] uppercase tracking-[0.12em]">#</th>
                  {campaign.columns.map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-4 py-3 text-[10px] uppercase tracking-[0.12em]"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((recipient, index) => (
                  <tr key={recipient.email} className="border-b border-fg/8 text-fg/80">
                    <td className="px-4 py-2.5 text-fg/40">{start + index + 1}</td>
                    {campaign.columns.map((column, position) => (
                      <td
                        key={column}
                        className={`px-4 py-2.5 ${position === 0 ? "text-fg" : ""}`}
                      >
                        {recipient.values[column] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.1em] text-fg/50">
            <span>
              {start + 1}–{Math.min(start + PAGE_SIZE, campaign.recipients.length)} of{" "}
              {campaign.recipients.length}
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
        </>
      )}
    </div>
  );
}
